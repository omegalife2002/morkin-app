import { useState, useRef, useCallback, useEffect } from 'react'
import { TERRAIN, SITES, SPECIAL_SITES, TRAVEL_REF, MAP_COLS, MAP_ROWS, HEX_SIZE, MAP_OFFSET_X, MAP_OFFSET_Y } from '../data/gameData'
import { MiniBtn, SectionTitle } from './UI'

// ── Hex geometry (flat-top) ───────────────────────────────────────────────────
const CS = 1.5 * HEX_SIZE
const RS = Math.sqrt(3) * HEX_SIZE

function hexCenter(col, row, ox, oy) {
  return {
    x: ox + col * CS,
    y: oy + row * RS + (col % 2 === 1 ? RS / 2 : 0),
  }
}

function hexPoints(cx, cy, size) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i
    return `${cx + size * Math.cos(a)},${cy + size * Math.sin(a)}`
  }).join(' ')
}

const SVG_W = MAP_COLS * CS + HEX_SIZE * 4
const SVG_H = MAP_ROWS * RS + RS * 2 + 100

// ── Calibration persistence ───────────────────────────────────────────────────
const CAL_KEY = 'morkin-cal-v2'
function loadCal() {
  try { return JSON.parse(localStorage.getItem(CAL_KEY)) } catch { return null }
}
function saveCal(c) { localStorage.setItem(CAL_KEY, JSON.stringify(c)) }

const DEFAULT_CAL = { ox: MAP_OFFSET_X, oy: MAP_OFFSET_Y, locked: false }

// ── Terrain colours ───────────────────────────────────────────────────────────
const TC = {
  unknown:  { fill: 'rgba(6,6,14,0.30)',  stroke: 'rgba(100,95,130,0.55)' },
  plains:   { fill: 'rgba(30,50,18,0.20)', stroke: 'rgba(80,130,60,0.7)' },
  forest:   { fill: 'rgba(10,38,10,0.25)', stroke: 'rgba(40,100,40,0.7)' },
  downs:    { fill: 'rgba(40,34,14,0.20)', stroke: 'rgba(100,88,40,0.7)' },
  mountain: { fill: 'rgba(22,22,22,0.22)', stroke: 'rgba(90,90,90,0.7)' },
  wastes:   { fill: 'rgba(14,18,32,0.28)', stroke: 'rgba(50,60,100,0.7)' },
}

function displayCoord(key) {
  const [c, r] = key.split(',').map(Number)
  return `${c + 1}, ${r + 1}`
}

const TERRAIN_TABLE = {
  plains:   ['Plains','Plains','Plains','Downs','Forest','Mountain'],
  forest:   ['Forest','Forest','Forest','Plains','Downs','Mountain'],
  downs:    ['Downs','Downs','Plains','Plains','Forest','Mountain'],
  mountain: ['Mountain','Mountain','Mountain','Downs','Forest','Plains'],
  unknown:  ['Plains','Plains','Forest','Forest','Downs','Mountain'],
}
const SITES_TABLE = ['Tower','Tower','Keep','Keep','Citadel','Village','Village','Henge','Lith','Snowhall']

// ── HexCell ───────────────────────────────────────────────────────────────────
function HexCell({ col, row, cell, isSelected, onClick, ox, oy }) {
  const { x: cx, y: cy } = hexCenter(col, row, ox, oy)
  const pts = hexPoints(cx, cy, HEX_SIZE - 1)
  const s = SITES[cell.site]
  const unknown = !cell.explored
  const tc = TC[cell.terrain] || TC.unknown

  const stroke = isSelected ? '#d4a843' : cell.playerHere ? '#f0dc80' : unknown ? tc.stroke : tc.stroke
  const sw = isSelected ? 2.5 : cell.playerHere ? 2 : 0.8
  const fill = isSelected
    ? 'rgba(212,168,67,0.22)'
    : cell.playerHere ? 'rgba(240,220,120,0.12)'
    : unknown ? TC.unknown.fill
    : tc.fill

  return (
    <g onClick={() => onClick(col, row)} style={{ cursor: 'pointer' }}>
      <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={sw} style={{ transition: 'fill 0.18s' }} />
      {!unknown && cell.terrain !== 'unknown' && (
        <text x={cx} y={cy + HEX_SIZE - 5} textAnchor="middle" fontSize={7} fill={tc.stroke} opacity={0.5} style={{ userSelect: 'none' }}>
          {cell.terrain === 'mountain' ? '▲' : cell.terrain === 'forest' ? '♦' : cell.terrain === 'downs' ? '~' : cell.terrain === 'wastes' ? '✦' : ''}
        </text>
      )}
      {cell.site !== 'none' && !unknown && (
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize={13} style={{ userSelect: 'none', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.9))' }}>
          {s?.glyph}
        </text>
      )}
      {cell.playerHere && (
        <>
          <circle cx={cx} cy={cy - (cell.site !== 'none' ? 12 : 0)} r={5} fill="#f0dc80" opacity={0.95} style={{ filter: 'drop-shadow(0 0 4px #d4a843)' }} />
          <circle cx={cx} cy={cy - (cell.site !== 'none' ? 12 : 0)} r={7} fill="none" stroke="#f0dc80" strokeWidth={1.5} opacity={0.4} />
        </>
      )}
      {isSelected && unknown && (
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize={8} fill="#6a6080" style={{ userSelect: 'none' }}>
          {col + 1},{row + 1}
        </text>
      )}
      {cell.questedHere && !unknown && <text x={cx - 10} y={cy - HEX_SIZE + 7} fontSize={8} fill="#e06060" opacity={0.9} style={{ userSelect: 'none' }}>⚔</text>}
      {cell.notes && !unknown && <text x={cx + 5} y={cy - HEX_SIZE + 7} fontSize={8} fill="#90c0ff" opacity={0.9} style={{ userSelect: 'none' }}>✎</text>}
    </g>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function HexMap({ grid, updateHex, movePlayer }) {
  const saved = loadCal()
  const [cal, setCal] = useState(saved || DEFAULT_CAL)
  const [calOpen, setCalOpen] = useState(!cal.locked)

  const [selected, setSelected]     = useState('16,41')
  const [panOffset, setPanOffset]   = useState({ x: 0, y: 0 })
  const [zoom, setZoom]             = useState(0.85)
  const [dragStart, setDragStart]   = useState(null)
  const [notesText, setNotesText]   = useState('')
  const [hexPanel, setHexPanel]     = useState('reveal')
  const [diceResult, setDiceResult] = useState(null)
  const containerRef = useRef()

  const { ox, oy } = cal

  const selCell = grid[selected] || { terrain: 'unknown', site: 'none', explored: false, playerHere: false, notes: '', specialSite: '', questedHere: false, soughtHere: false }
  const [selCol, selRow] = selected.split(',').map(Number)

  // ── Calibration helpers ───────────────────────────────────────────────────
  const updateCal = (updates) => setCal(prev => ({ ...prev, ...updates }))

  const lockCal = () => {
    const next = { ...cal, locked: true }
    saveCal(next)
    setCal(next)
    setCalOpen(false)
  }

  const unlockCal = () => {
    setCal(prev => ({ ...prev, locked: false }))
    setCalOpen(true)
  }

  const resetCal = () => {
    const next = { ...DEFAULT_CAL, locked: false }
    saveCal(next)
    setCal(next)
  }

  // ── Terrain reveal ────────────────────────────────────────────────────────
  const getAdjacentTerrain = useCallback(() => {
    const dirs = selCol % 2 === 0
      ? [[-1,-1],[-1,0],[0,-1],[0,1],[1,-1],[1,0]]
      : [[-1,0],[-1,1],[0,-1],[0,1],[1,0],[1,1]]
    const found = dirs.map(([dc,dr]) => grid[`${selCol+dc},${selRow+dr}`])
      .filter(h => h?.explored && h.terrain !== 'unknown')
      .map(h => h.terrain)
    return found[0] || 'unknown'
  }, [selected, grid])

  const rollTerrain = () => {
    const siteRoll = Math.floor(Math.random() * 10) + 1
    if (siteRoll === 1) {
      const idx = Math.floor(Math.random() * 10)
      const site = SITES_TABLE[idx].toLowerCase().replace(' ', '_')
      setDiceResult(`D10=${siteRoll} → Site! → ${SITES_TABLE[idx]}`)
      updateHex(selected, { terrain: 'plains', site, explored: true })
    } else {
      const adj = getAdjacentTerrain()
      const table = TERRAIN_TABLE[adj] || TERRAIN_TABLE.unknown
      const r = Math.floor(Math.random() * 6)
      const terrain = table[r].toLowerCase()
      setDiceResult(`D10=${siteRoll} (no site) · D6=${r+1} → ${table[r]}${adj !== 'unknown' ? ` (adj: ${adj})` : ''}`)
      updateHex(selected, { terrain, explored: true })
    }
  }

  // ── Pan / zoom ────────────────────────────────────────────────────────────
  const handleMouseDown = (e) => {
    if (e.button === 1 || e.button === 2) {
      e.preventDefault()
      setDragStart({ mx: e.clientX, my: e.clientY, ox: panOffset.x, oy: panOffset.y })
    }
  }
  const handleMouseMove = (e) => {
    if (dragStart) setPanOffset({ x: dragStart.ox + e.clientX - dragStart.mx, y: dragStart.oy + e.clientY - dragStart.my })
  }
  const handleMouseUp = () => setDragStart(null)
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    setZoom(z => Math.max(0.2, Math.min(3.0, z - e.deltaY * 0.001)))
  }, [])
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  const handleHexClick = useCallback((c, r) => {
    const key = `${c},${r}`
    setSelected(key)
    setNotesText(grid[key]?.notes || '')
    setDiceResult(null)
  }, [grid])

  const travel = TRAVEL_REF[selCell.terrain]

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── Side panel ── */}
      <div style={{ width: 282, flexShrink: 0, background: 'var(--panel)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ── Calibration panel ── */}
        {calOpen && (
          <div style={{ background: '#100e00', borderBottom: '2px solid var(--gold)', padding: '12px 14px', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.875rem', color: 'var(--gold)', letterSpacing: 1 }}>⚙ GRID POSITION</span>
              <button onClick={resetCal} style={{ padding: '2px 8px', background: '#1a0a0a', border: '1px solid #5a2020', color: '#c06060', fontFamily: 'Cinzel, serif', fontSize: '0.8rem', cursor: 'pointer', borderRadius: 2 }}>Reset</button>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 10, lineHeight: 1.5 }}>
              Shift the hex grid over the map image. Lock when aligned.
            </div>

            {/* X offset */}
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.875rem', color: 'var(--text-dim)' }}>Grid X</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={() => updateCal({ ox: ox - 5 })} style={nudgeBtn}>−5</button>
                  <button onClick={() => updateCal({ ox: ox - 1 })} style={nudgeBtn}>−1</button>
                  <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.9375rem', color: 'var(--gold)', minWidth: 48, textAlign: 'center' }}>{ox.toFixed(1)}</span>
                  <button onClick={() => updateCal({ ox: ox + 1 })} style={nudgeBtn}>+1</button>
                  <button onClick={() => updateCal({ ox: ox + 5 })} style={nudgeBtn}>+5</button>
                </div>
              </div>
              <input type="range" min={-100} max={300} step={0.5} value={ox}
                onChange={e => updateCal({ ox: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--gold)' }} />
            </div>

            {/* Y offset */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.875rem', color: 'var(--text-dim)' }}>Grid Y</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={() => updateCal({ oy: oy - 5 })} style={nudgeBtn}>−5</button>
                  <button onClick={() => updateCal({ oy: oy - 1 })} style={nudgeBtn}>−1</button>
                  <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.9375rem', color: 'var(--gold)', minWidth: 48, textAlign: 'center' }}>{oy.toFixed(1)}</span>
                  <button onClick={() => updateCal({ oy: oy + 1 })} style={nudgeBtn}>+1</button>
                  <button onClick={() => updateCal({ oy: oy + 5 })} style={nudgeBtn}>+5</button>
                </div>
              </div>
              <input type="range" min={-100} max={300} step={0.5} value={oy}
                onChange={e => updateCal({ oy: Number(e.target.value) })}
                style={{ width: '100%', accentColor: 'var(--gold)' }} />
            </div>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button onClick={lockCal} style={{ flex: 1, padding: '8px', fontFamily: 'Cinzel, serif', fontSize: '0.875rem', background: '#1e1800', border: '1px solid var(--gold)', color: 'var(--gold)', cursor: 'pointer', borderRadius: 2, letterSpacing: 1 }}>
                🔒 LOCK POSITION
              </button>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)', fontFamily: 'Cinzel, serif' }}>
                ox={ox.toFixed(0)} oy={oy.toFixed(0)}
              </span>
            </div>
          </div>
        )}

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-dim)', background: 'var(--panel-alt)', flexShrink: 0 }}>
          {['reveal', 'terrain', 'site', 'notes'].map(t => (
            <button key={t} onClick={() => setHexPanel(t)} style={{
              flex: 1, padding: '9px 2px', background: 'none', border: 'none',
              fontFamily: 'Cinzel, serif', fontSize: '0.8rem', letterSpacing: 0.5,
              cursor: 'pointer', textTransform: 'uppercase',
              color: hexPanel === t ? 'var(--gold)' : 'var(--text-muted)',
              borderBottom: `2px solid ${hexPanel === t ? 'var(--gold)' : 'transparent'}`,
            }}>{t}</button>
          ))}
          {!calOpen && (
            <button onClick={unlockCal} title="Adjust grid position" style={{ padding: '9px 10px', background: 'none', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', fontSize: '1rem' }}>⚙</button>
          )}
        </div>

        {/* Panel content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>

          {/* Hex info */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: '1.125rem', color: 'var(--gold)', letterSpacing: 1, marginBottom: 4 }}>
              HEX {displayCoord(selected)}
            </div>
            {selCell.specialSite && SPECIAL_SITES[selCell.specialSite] && (
              <div style={{ fontSize: '0.875rem', color: '#90c0ff', marginBottom: 4 }}>{SPECIAL_SITES[selCell.specialSite]}</div>
            )}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {selCell.playerHere  && <Badge gold>YOU ARE HERE</Badge>}
              {selCell.explored    && <Badge green>{selCell.terrain !== 'unknown' ? selCell.terrain.toUpperCase() : 'EXPLORED'}</Badge>}
              {!selCell.explored   && <Badge muted>UNKNOWN</Badge>}
              {selCell.site !== 'none' && selCell.explored && <Badge blue>{SITES[selCell.site]?.label}</Badge>}
              {selCell.questedHere && <Badge red>⚔ QUESTED</Badge>}
            </div>
          </div>

          {/* Quick actions */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 14, flexWrap: 'wrap' }}>
            <MiniBtn onClick={() => movePlayer(selected)} style={{ borderColor: 'var(--gold)', color: 'var(--gold)', fontSize: '0.875rem' }}>⬡ Move Here</MiniBtn>
            <MiniBtn onClick={() => updateHex(selected, { explored: !selCell.explored })} style={{ fontSize: '0.875rem' }}>{selCell.explored ? '✗ Hide' : '✓ Reveal'}</MiniBtn>
            <MiniBtn onClick={() => updateHex(selected, { questedHere: !selCell.questedHere })} style={{ fontSize: '0.875rem', color: selCell.questedHere ? '#e06060' : undefined }}>⚔</MiniBtn>
            <MiniBtn onClick={() => updateHex(selected, { soughtHere: !selCell.soughtHere })} style={{ fontSize: '0.875rem', color: selCell.soughtHere ? '#90c0ff' : undefined }}>🔍</MiniBtn>
          </div>

          {/* REVEAL tab */}
          {hexPanel === 'reveal' && (
            <>
              <SectionTitle>Reveal Hex</SectionTitle>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 10, lineHeight: 1.6 }}>
                Roll to determine terrain and site per random map rules.
              </div>
              <button onClick={rollTerrain} style={{ width: '100%', padding: '10px', marginBottom: 8, fontFamily: 'Cinzel, serif', fontSize: '0.9375rem', letterSpacing: 1, background: '#0e0e14', border: '1px solid var(--gold)', color: 'var(--gold)', cursor: 'pointer', borderRadius: 2 }}>
                🎲 Roll Terrain + Site
              </button>
              {diceResult && (
                <div style={{ padding: '8px 10px', background: '#0b0b10', border: '1px solid var(--border-dim)', borderRadius: 2, fontSize: '0.875rem', color: '#90c0ff', fontStyle: 'italic', marginBottom: 10, lineHeight: 1.5 }}>
                  {diceResult}
                </div>
              )}
              <SectionTitle>Terrain Table (D6)</SectionTitle>
              {[['Plains','1–3 Plains · 4 Downs · 5 Forest · 6 Mtn'],['Forest','1–3 Forest · 4 Plains · 5 Downs · 6 Mtn'],['Downs','1–2 Downs · 3–4 Plains · 5 Forest · 6 Mtn'],['Mountain','1–3 Mtn · 4 Downs · 5 Forest · 6 Plains']].map(([k,v]) => (
                <div key={k} style={{ display: 'flex', gap: 6, fontSize: '0.8125rem', borderBottom: '1px solid var(--border-dim)', padding: '3px 0' }}>
                  <span style={{ color: 'var(--gold)', fontFamily: 'Cinzel, serif', minWidth: 60 }}>{k}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{v}</span>
                </div>
              ))}
              <SectionTitle style={{ marginTop: 10 }}>Site Table (D10=1 → site)</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px' }}>
                {SITES_TABLE.map((s, i) => (
                  <div key={i} style={{ fontSize: '0.8125rem', display: 'flex', gap: 4 }}>
                    <span style={{ color: 'var(--gold)', fontFamily: 'Cinzel, serif', minWidth: 18 }}>{i + 1}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{s}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* TERRAIN tab */}
          {hexPanel === 'terrain' && (
            <>
              <SectionTitle>Set Terrain</SectionTitle>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                {Object.entries(TERRAIN).filter(([k]) => k !== 'unknown').map(([k, v]) => (
                  <button key={k} onClick={() => updateHex(selected, { terrain: k, explored: true })} style={{ padding: '5px 12px', borderRadius: 20, fontSize: '0.875rem', background: selCell.terrain === k ? v.color : 'var(--panel-alt)', border: `1px solid ${selCell.terrain === k ? v.stroke : 'var(--border)'}`, color: selCell.terrain === k ? '#e0d0b0' : 'var(--text-dim)', fontFamily: 'Cinzel, serif', cursor: 'pointer', transition: 'all 0.15s' }}>{v.label}</button>
                ))}
              </div>
              {travel && selCell.terrain !== 'unknown' && (
                <div style={{ background: 'var(--panel-alt)', border: '1px solid var(--border-dim)', padding: 12, borderRadius: 2 }}>
                  <SectionTitle>Travel</SectionTitle>
                  {selCell.terrain === 'wastes'
                    ? <div style={{ color: '#c83030' }}>⛔ IMPASSABLE</div>
                    : <>
                        <div style={{ color: 'var(--text-dim)', marginBottom: 3 }}>🐎 {travel.horse}</div>
                        <div style={{ color: 'var(--text-dim)', marginBottom: 6 }}>👣 {travel.walk}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Fatigue: {travel.fatigueHorse} horse · {travel.fatigueWalk} walk</div>
                      </>
                  }
                </div>
              )}
            </>
          )}

          {/* SITE tab */}
          {hexPanel === 'site' && (
            <>
              <SectionTitle>Site Type</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 14 }}>
                {Object.entries(SITES).map(([k, v]) => (
                  <button key={k} onClick={() => updateHex(selected, { site: k })} style={{ padding: '5px 8px', textAlign: 'left', background: selCell.site === k ? '#1e1800' : 'var(--panel-alt)', border: `1px solid ${selCell.site === k ? 'var(--gold)' : 'var(--border)'}`, color: v.dark ? '#e08080' : 'var(--text-dim)', fontFamily: 'Cinzel, serif', fontSize: '0.875rem', cursor: 'pointer', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span>{v.glyph}</span><span>{v.label}</span>
                  </button>
                ))}
              </div>
              <SectionTitle>Special Site #</SectionTitle>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="text" value={selCell.specialSite || ''} onChange={e => updateHex(selected, { specialSite: e.target.value })} placeholder="1–12"
                  style={{ width: 56, background: '#0a0a0e', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Cinzel, serif', fontSize: '1rem', padding: '4px 8px', borderRadius: 2 }} />
                {selCell.specialSite && SPECIAL_SITES[selCell.specialSite] && (
                  <span style={{ fontSize: '0.875rem', color: '#90c0ff', fontStyle: 'italic' }}>{SPECIAL_SITES[selCell.specialSite]}</span>
                )}
              </div>
            </>
          )}

          {/* NOTES tab */}
          {hexPanel === 'notes' && (
            <>
              <SectionTitle>Hex Notes</SectionTitle>
              <textarea value={notesText} onChange={e => setNotesText(e.target.value)} onBlur={() => updateHex(selected, { notes: notesText })} placeholder="Record events, encounters, finds…" rows={7}
                style={{ width: '100%', background: '#0a0a0e', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'IM Fell English, serif', fontSize: '1rem', padding: 10, resize: 'none', borderRadius: 2, lineHeight: 1.6 }} />
            </>
          )}
        </div>

        {/* Terrain legend */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-dim)', background: 'var(--panel-alt)', flexShrink: 0 }}>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.875rem', color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 5 }}>TERRAIN KEY</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {Object.entries(TERRAIN).filter(([k]) => k !== 'unknown').map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <div style={{ width: 10, height: 10, background: v.color, border: `1px solid ${v.stroke}`, borderRadius: 2 }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{v.label}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 6, fontSize: '0.8rem', color: 'var(--text-faint)', fontStyle: 'italic' }}>Scroll to zoom · Right-drag to pan</div>
        </div>
      </div>

      {/* ── Map canvas ── */}
      <div ref={containerRef}
        style={{ flex: 1, overflow: 'hidden', position: 'relative', background: '#08080c', cursor: dragStart ? 'grabbing' : 'default' }}
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
        onContextMenu={e => e.preventDefault()}>

        <div style={{ transform: `translate(${panOffset.x}px,${panOffset.y}px) scale(${zoom})`, transformOrigin: '0 0', position: 'relative', width: SVG_W, height: SVG_H }}>
          {/* Background image — fixed, never moves with grid */}
          <img
            src={`${import.meta.env.BASE_URL}morkin_map.jpg`}
            alt="map"
            style={{ position: 'absolute', top: 0, left: 0, width: SVG_W, height: SVG_H, opacity: 0.88, pointerEvents: 'none', userSelect: 'none' }}
          />
          {/* SVG hex grid — shifts only via ox/oy */}
          <svg width={SVG_W} height={SVG_H} style={{ position: 'absolute', top: 0, left: 0 }}>
            {Array.from({ length: MAP_COLS }, (_, c) =>
              Array.from({ length: MAP_ROWS }, (_, r) => {
                const key = `${c},${r}`
                const cell = grid[key] || { terrain: 'unknown', site: 'none', explored: false, playerHere: false, notes: '', specialSite: '', questedHere: false, soughtHere: false }
                return <HexCell key={key} col={c} row={r} cell={cell} isSelected={selected === key} onClick={handleHexClick} ox={ox} oy={oy} />
              })
            )}
          </svg>
          {/* Calibration crosshair — shows hex 1,1 origin when unlocked */}
          {calOpen && (
            <svg width={SVG_W} height={SVG_H} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
              <line x1={ox} y1={0} x2={ox} y2={SVG_H} stroke="#ff4040" strokeWidth={1} opacity={0.4} strokeDasharray="4 4" />
              <line x1={0} y1={oy} x2={SVG_W} y2={oy} stroke="#ff4040" strokeWidth={1} opacity={0.4} strokeDasharray="4 4" />
              <circle cx={ox} cy={oy} r={6} fill="none" stroke="#ff4040" strokeWidth={1.5} opacity={0.7} />
              <text x={ox + 10} y={oy - 8} fontSize={11} fill="#ff6060" opacity={0.9}>grid origin ({ox.toFixed(0)},{oy.toFixed(0)})</text>
            </svg>
          )}
        </div>

        {/* Zoom controls */}
        <div style={{ position: 'absolute', bottom: 14, right: 14, display: 'flex', gap: 4, zIndex: 10 }}>
          <button onClick={() => setZoom(z => Math.min(3, z + 0.15))} style={zoomBtn}>+</button>
          <button onClick={() => setZoom(1.0)} style={{ ...zoomBtn, padding: '0 12px', fontSize: '0.875rem' }}>{Math.round(zoom * 100)}%</button>
          <button onClick={() => setZoom(z => Math.max(0.2, z - 0.15))} style={zoomBtn}>−</button>
        </div>

        {/* Lock indicator */}
        {cal.locked && (
          <div style={{ position: 'absolute', top: 10, right: 14, fontSize: '0.875rem', fontFamily: 'Cinzel, serif', color: 'var(--text-faint)', zIndex: 10 }}>
            🔒 locked
          </div>
        )}
      </div>
    </div>
  )
}

const nudgeBtn = {
  padding: '2px 7px', background: '#0e0e14', border: '1px solid #3a3020',
  color: '#d4a843', cursor: 'pointer', fontSize: '0.875rem', borderRadius: 2,
  fontFamily: 'Cinzel, serif',
}
const zoomBtn = {
  width: 34, height: 34, background: 'var(--panel)', border: '1px solid var(--border)',
  color: 'var(--gold)', fontSize: '1.25rem', borderRadius: 2, cursor: 'pointer',
  fontFamily: 'Cinzel, serif',
}

function Badge({ children, gold, green, red, blue, muted }) {
  const color  = gold ? 'var(--gold)' : green ? '#6aaf6a' : red ? '#e08080' : blue ? '#90c0ff' : 'var(--text-muted)'
  const border = gold ? '#c8a84b55' : green ? '#2a5020' : red ? '#5a1a1a' : blue ? '#2a4060' : 'var(--border)'
  const bg     = gold ? '#1e1800' : green ? '#0a140a' : red ? '#140a0a' : blue ? '#0a1020' : 'var(--panel-alt)'
  return <span style={{ fontSize: '0.875rem', padding: '2px 7px', background: bg, border: `1px solid ${border}`, color, borderRadius: 2, fontFamily: 'Cinzel, serif' }}>{children}</span>
}
