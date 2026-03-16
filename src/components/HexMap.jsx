import { useState, useRef, useCallback, useEffect } from 'react'
import { TERRAIN, SITES, SPECIAL_SITES, TRAVEL_REF, MAP_COLS, MAP_ROWS, HEX_SIZE } from '../data/gameData'
import { MiniBtn, SectionTitle } from './UI'

// ── Flat-top hex geometry ─────────────────────────────────────────────────────
const COL_SPACING = 1.5 * HEX_SIZE
const ROW_SPACING = Math.sqrt(3) * HEX_SIZE

function hexCenter(col, row) {
  return {
    x: HEX_SIZE + col * COL_SPACING,
    y: HEX_SIZE + row * ROW_SPACING + (col % 2 === 1 ? ROW_SPACING / 2 : 0),
  }
}

function flatHexPoints(cx, cy, size) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i
    return `${cx + size * Math.cos(a)},${cy + size * Math.sin(a)}`
  }).join(' ')
}

const SVG_W = MAP_COLS * COL_SPACING + HEX_SIZE * 2
const SVG_H = MAP_ROWS * ROW_SPACING + ROW_SPACING + HEX_SIZE * 2

const TERRAIN_COLORS = {
  unknown:  { fill: '#0d0d12', stroke: '#1e1e28' },
  plains:   { fill: '#1e2a14', stroke: '#3a5228' },
  forest:   { fill: '#102010', stroke: '#1e4020' },
  downs:    { fill: '#221e10', stroke: '#443c1e' },
  mountain: { fill: '#1a1a1a', stroke: '#383838' },
  wastes:   { fill: '#101420', stroke: '#1e2840' },
}

// Terrain table roll results (D6, influenced by adjacent terrain)
const TERRAIN_TABLE = {
  plains:   ['Plains','Plains','Plains','Downs','Forest','Mountain'],
  forest:   ['Forest','Forest','Forest','Plains','Downs','Mountain'],
  downs:    ['Downs','Downs','Plains','Plains','Forest','Mountain'],
  mountain: ['Mountain','Mountain','Mountain','Downs','Forest','Plains'],
  unknown:  ['Plains','Plains','Forest','Forest','Downs','Mountain'],
}

// Sites table (D10, roll when D10=1 on site check)
const SITES_ROLL_TABLE = [
  'Tower','Tower','Keep','Keep','Citadel','Village','Village','Henge','Lith','Snowhall',
]

// ── Single hex cell ───────────────────────────────────────────────────────────
function HexCell({ col, row, cell, isSelected, onClick }) {
  const { x: cx, y: cy } = hexCenter(col, row)
  const pts = flatHexPoints(cx, cy, HEX_SIZE - 1)
  const s = SITES[cell.site]
  const tc = TERRAIN_COLORS[cell.terrain] || TERRAIN_COLORS.unknown

  const isUnknown = !cell.explored
  const strokeColor = isSelected      ? '#d4a843'
                    : cell.playerHere ? '#f0dc80'
                    : isUnknown       ? '#252530'
                    : tc.stroke
  const strokeWidth = isSelected ? 2.5 : cell.playerHere ? 2 : 1
  const fillColor   = isSelected      ? (isUnknown ? '#1a1820' : tc.fill + 'dd')
                    : cell.playerHere ? (isUnknown ? '#151520' : tc.fill)
                    : isUnknown       ? '#0d0d12'
                    : tc.fill

  return (
    <g onClick={() => onClick(col, row)} style={{ cursor: 'pointer' }}>
      <polygon points={pts} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth}
        style={{ transition: 'fill 0.2s, stroke 0.2s' }} />

      {/* Terrain texture hint for explored hexes */}
      {!isUnknown && cell.terrain !== 'unknown' && (
        <text x={cx} y={cy + HEX_SIZE - 6} textAnchor="middle"
          fontSize={8} fill={tc.stroke} opacity={0.6} style={{ userSelect: 'none' }}>
          {cell.terrain === 'mountain' ? '▲' :
           cell.terrain === 'forest'   ? '♦' :
           cell.terrain === 'downs'    ? '~' :
           cell.terrain === 'wastes'   ? '✦' : ''}
        </text>
      )}

      {/* Site glyph */}
      {cell.site !== 'none' && !isUnknown && (
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
          fontSize={14} style={{ userSelect: 'none', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.9))' }}>
          {s.glyph}
        </text>
      )}

      {/* Player marker */}
      {cell.playerHere && (
        <>
          <circle cx={cx} cy={cy - (cell.site !== 'none' ? 12 : 0)} r={5}
            fill="#f0dc80" opacity={0.95}
            style={{ filter: 'drop-shadow(0 0 4px #d4a843)' }} />
          <circle cx={cx} cy={cy - (cell.site !== 'none' ? 12 : 0)} r={7}
            fill="none" stroke="#f0dc80" strokeWidth={1.5} opacity={0.4} />
        </>
      )}

      {/* Coord label on selected unknown hex */}
      {isSelected && isUnknown && (
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
          fontSize={9} fill="#5a5060" style={{ userSelect: 'none' }}>
          {col},{row}
        </text>
      )}

      {/* Notes / quest indicators */}
      {cell.questedHere && !isUnknown && (
        <text x={cx - 10} y={cy - HEX_SIZE + 8} fontSize={9} fill="#e06060"
          opacity={0.9} style={{ userSelect: 'none' }}>⚔</text>
      )}
      {cell.notes && !isUnknown && (
        <text x={cx + 5} y={cy - HEX_SIZE + 8} fontSize={9} fill="#90c0ff"
          opacity={0.9} style={{ userSelect: 'none' }}>✎</text>
      )}
    </g>
  )
}

// ── Main HexMap ───────────────────────────────────────────────────────────────
export default function HexMap({ grid, updateHex, movePlayer }) {
  const [selected, setSelected]     = useState('16,40')
  const [offset, setOffset]         = useState({ x: 0, y: 0 })
  const [zoom, setZoom]             = useState(0.8)
  const [dragStart, setDragStart]   = useState(null)
  const [notesText, setNotesText]   = useState(grid['16,40']?.notes || '')
  const [hexPanel, setHexPanel]     = useState('reveal')
  const [diceResult, setDiceResult] = useState(null)
  const containerRef = useRef()

  const selCell = grid[selected] || {
    terrain: 'unknown', site: 'none', explored: false,
    playerHere: false, notes: '', specialSite: '', questedHere: false, soughtHere: false,
  }

  const [col, row] = selected.split(',').map(Number)

  // Get adjacent hexes for context
  const getAdjacentTerrain = useCallback(() => {
    const dirs = col % 2 === 0
      ? [[-1,-1],[-1,0],[0,-1],[0,1],[1,-1],[1,0]]
      : [[-1,0],[-1,1],[0,-1],[0,1],[1,0],[1,1]]
    const terrains = dirs
      .map(([dc, dr]) => grid[`${col+dc},${row+dr}`])
      .filter(h => h && h.explored && h.terrain !== 'unknown')
      .map(h => h.terrain)
    return terrains.length > 0 ? terrains[0] : 'unknown'
  }, [selected, grid])

  // Roll to reveal terrain
  const rollTerrain = () => {
    // First: D10 site check
    const siteRoll = Math.floor(Math.random() * 10) + 1
    const hasSite = siteRoll === 1

    let site = 'none'
    let terrain = 'plains'

    if (hasSite) {
      const siteIdx = Math.floor(Math.random() * 10)
      site = SITES_ROLL_TABLE[siteIdx].toLowerCase().replace(' ', '_')
      terrain = 'plains'
      setDiceResult(`D10=${siteRoll} → Site! D10 for site type → ${SITES_ROLL_TABLE[siteIdx]}`)
    } else {
      // D6 terrain roll, influenced by adjacent terrain
      const adjTerrain = getAdjacentTerrain()
      const table = TERRAIN_TABLE[adjTerrain] || TERRAIN_TABLE.unknown
      const terrainRoll = Math.floor(Math.random() * 6)
      terrain = table[terrainRoll].toLowerCase()
      setDiceResult(`D10=${siteRoll} (no site) · D6=${terrainRoll+1} → ${table[terrainRoll]}${adjTerrain !== 'unknown' ? ` (adj: ${adjTerrain})` : ''}`)
    }

    updateHex(selected, { terrain, site, explored: true })
  }

  // Roll for site type only
  const rollSite = () => {
    const roll = Math.floor(Math.random() * 10) + 1
    const site = SITES_ROLL_TABLE[roll - 1].toLowerCase().replace(' ', '_')
    setDiceResult(`D10=${roll} → ${SITES_ROLL_TABLE[roll-1]}`)
    updateHex(selected, { site })
  }

  const handleHexClick = useCallback((c, r) => {
    const key = `${c},${r}`
    setSelected(key)
    setNotesText(grid[key]?.notes || '')
    setDiceResult(null)
  }, [grid])

  const handleMouseDown = (e) => {
    if (e.button === 1 || e.button === 2) {
      e.preventDefault()
      setDragStart({ mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y })
    }
  }
  const handleMouseMove = (e) => {
    if (dragStart) setOffset({ x: dragStart.ox + e.clientX - dragStart.mx, y: dragStart.oy + e.clientY - dragStart.my })
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

  const travel = TRAVEL_REF[selCell.terrain]

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── Side panel ── */}
      <div style={{
        width: 280, flexShrink: 0, background: 'var(--panel)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>

        {/* Panel tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-dim)', background: 'var(--panel-alt)' }}>
          {['reveal','terrain','site','notes'].map(t => (
            <button key={t} onClick={() => setHexPanel(t)} style={{
              flex: 1, padding: '9px 2px', background: 'none', border: 'none',
              fontFamily: 'Cinzel, serif', fontSize: '0.8rem', letterSpacing: 0.5,
              cursor: 'pointer', textTransform: 'uppercase',
              color: hexPanel === t ? 'var(--gold)' : 'var(--text-muted)',
              borderBottom: `2px solid ${hexPanel === t ? 'var(--gold)' : 'transparent'}`,
            }}>{t}</button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>

          {/* Hex identity */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: '1.125rem', color: 'var(--gold)', letterSpacing: 1, marginBottom: 4 }}>
              HEX {selected}
            </div>
            {selCell.specialSite && SPECIAL_SITES[selCell.specialSite] && (
              <div style={{ fontSize: '0.875rem', color: '#90c0ff', marginBottom: 4 }}>
                {SPECIAL_SITES[selCell.specialSite]}
              </div>
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
            <MiniBtn onClick={() => movePlayer(selected)}
              style={{ borderColor: 'var(--gold)', color: 'var(--gold)', fontSize: '0.875rem' }}>
              ⬡ Move Here
            </MiniBtn>
            <MiniBtn onClick={() => updateHex(selected, { explored: !selCell.explored })}
              style={{ fontSize: '0.875rem' }}>
              {selCell.explored ? '✗ Hide' : '✓ Reveal'}
            </MiniBtn>
            <MiniBtn onClick={() => updateHex(selected, { questedHere: !selCell.questedHere })}
              style={{ fontSize: '0.875rem', color: selCell.questedHere ? '#e06060' : undefined }}>⚔</MiniBtn>
            <MiniBtn onClick={() => updateHex(selected, { soughtHere: !selCell.soughtHere })}
              style={{ fontSize: '0.875rem', color: selCell.soughtHere ? '#90c0ff' : undefined }}>🔍</MiniBtn>
          </div>

          {/* ── REVEAL tab ── */}
          {hexPanel === 'reveal' && (
            <>
              <SectionTitle>Reveal Hex</SectionTitle>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 10, lineHeight: 1.6 }}>
                Roll to reveal this hex per the random map rules. Adjacent terrain influences the result.
              </div>

              <button onClick={rollTerrain} style={{
                width: '100%', padding: '10px', marginBottom: 8,
                fontFamily: 'Cinzel, serif', fontSize: '0.9375rem', letterSpacing: 1,
                background: '#0e0e14', border: '1px solid var(--gold)',
                color: 'var(--gold)', cursor: 'pointer', borderRadius: 2,
              }}>
                🎲 Roll Terrain + Site
              </button>

              {diceResult && (
                <div style={{
                  padding: '8px 10px', background: '#0b0b10',
                  border: '1px solid var(--border-dim)', borderRadius: 2,
                  fontSize: '0.875rem', color: '#90c0ff', fontStyle: 'italic',
                  marginBottom: 10, lineHeight: 1.5,
                }}>
                  {diceResult}
                </div>
              )}

              <SectionTitle>Terrain Table (D6)</SectionTitle>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-dim)', lineHeight: 1.8, marginBottom: 10 }}>
                {['Plains → 1-3 Plains, 4 Downs, 5 Forest, 6 Mountain',
                  'Forest → 1-3 Forest, 4 Plains, 5 Downs, 6 Mountain',
                  'Downs  → 1-2 Downs, 3-4 Plains, 5 Forest, 6 Mountain',
                  'Mountain → 1-3 Mtn, 4 Downs, 5 Forest, 6 Plains',
                ].map(t => (
                  <div key={t} style={{ borderBottom: '1px solid #1a1510', paddingBottom: 2, marginBottom: 2, fontSize: '0.8125rem' }}>{t}</div>
                ))}
              </div>

              <SectionTitle>Site Check (D10)</SectionTitle>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-dim)', lineHeight: 1.7 }}>
                Roll 1 → Site present (terrain = Plains). Then roll D10 for site type:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px', marginTop: 6 }}>
                {SITES_ROLL_TABLE.map((s, i) => (
                  <div key={i} style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', display: 'flex', gap: 4 }}>
                    <span style={{ color: 'var(--gold)', fontFamily: 'Cinzel, serif', minWidth: 18 }}>{i+1}</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── TERRAIN tab ── */}
          {hexPanel === 'terrain' && (
            <>
              <SectionTitle>Set Terrain</SectionTitle>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                {Object.entries(TERRAIN).filter(([k]) => k !== 'unknown').map(([k, v]) => (
                  <button key={k} onClick={() => updateHex(selected, { terrain: k, explored: true })} style={{
                    padding: '5px 12px', borderRadius: 20, fontSize: '0.875rem',
                    background: selCell.terrain === k ? v.color : 'var(--panel-alt)',
                    border: `1px solid ${selCell.terrain === k ? v.stroke : 'var(--border)'}`,
                    color: selCell.terrain === k ? '#e0d0b0' : 'var(--text-dim)',
                    fontFamily: 'Cinzel, serif', cursor: 'pointer', transition: 'all 0.15s',
                  }}>{v.label}</button>
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
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                          Fatigue: {travel.fatigueHorse} horse · {travel.fatigueWalk} walk
                        </div>
                      </>
                  }
                </div>
              )}
            </>
          )}

          {/* ── SITE tab ── */}
          {hexPanel === 'site' && (
            <>
              <SectionTitle right={<button onClick={rollSite} style={{ background:'none',border:'1px solid var(--border)',color:'var(--gold)',fontFamily:'Cinzel,serif',fontSize:'0.8rem',padding:'2px 8px',cursor:'pointer',borderRadius:2 }}>Roll D10</button>}>
                Site Type
              </SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 14 }}>
                {Object.entries(SITES).map(([k, v]) => (
                  <button key={k} onClick={() => updateHex(selected, { site: k })} style={{
                    padding: '5px 8px', textAlign: 'left',
                    background: selCell.site === k ? '#1e1800' : 'var(--panel-alt)',
                    border: `1px solid ${selCell.site === k ? 'var(--gold)' : 'var(--border)'}`,
                    color: v.dark ? '#e08080' : 'var(--text-dim)',
                    fontFamily: 'Cinzel, serif', fontSize: '0.875rem', cursor: 'pointer',
                    borderRadius: 2, display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    <span>{v.glyph}</span><span>{v.label}</span>
                  </button>
                ))}
              </div>

              <SectionTitle>Special Site #</SectionTitle>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="text" value={selCell.specialSite || ''}
                  onChange={e => updateHex(selected, { specialSite: e.target.value })}
                  placeholder="1–12"
                  style={{ width: 56, background: '#0a0a0e', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'Cinzel, serif', fontSize: '1rem', padding: '4px 8px', borderRadius: 2 }} />
                {selCell.specialSite && SPECIAL_SITES[selCell.specialSite] && (
                  <span style={{ fontSize: '0.875rem', color: '#90c0ff', fontStyle: 'italic' }}>
                    {SPECIAL_SITES[selCell.specialSite]}
                  </span>
                )}
              </div>
            </>
          )}

          {/* ── NOTES tab ── */}
          {hexPanel === 'notes' && (
            <>
              <SectionTitle>Hex Notes</SectionTitle>
              <textarea value={notesText}
                onChange={e => setNotesText(e.target.value)}
                onBlur={() => updateHex(selected, { notes: notesText })}
                placeholder="Record events, encounters, finds…"
                rows={7}
                style={{ width: '100%', background: '#0a0a0e', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'IM Fell English, serif', fontSize: '1rem', padding: 10, resize: 'none', borderRadius: 2, lineHeight: 1.6 }} />
            </>
          )}
        </div>

        {/* Terrain legend */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-dim)', background: 'var(--panel-alt)' }}>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.875rem', color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 6 }}>TERRAIN KEY</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {Object.entries(TERRAIN).filter(([k]) => k !== 'unknown').map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 12, height: 12, background: v.color, border: `1px solid ${v.stroke}`, borderRadius: 2 }} />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{v.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Map canvas ── */}
      <div
        ref={containerRef}
        style={{ flex: 1, overflow: 'hidden', position: 'relative', background: '#06060a', cursor: dragStart ? 'grabbing' : 'default' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={e => e.preventDefault()}
      >
        <div style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>
          <svg width={SVG_W} height={SVG_H} style={{ display: 'block' }}>
            {/* Background */}
            <rect width={SVG_W} height={SVG_H} fill="#06060a" />

            {/* Subtle grid lines for all hexes */}
            {Array.from({ length: MAP_COLS }, (_, c) =>
              Array.from({ length: MAP_ROWS }, (_, r) => {
                const key = `${c},${r}`
                const cell = grid[key] || { terrain:'unknown',site:'none',explored:false,playerHere:false,notes:'',specialSite:'',questedHere:false,soughtHere:false }
                return (
                  <HexCell key={key} col={c} row={r} cell={cell}
                    isSelected={selected === key}
                    onClick={handleHexClick}
                  />
                )
              })
            )}
          </svg>
        </div>

        {/* Zoom controls */}
        <div style={{ position: 'absolute', bottom: 14, right: 14, display: 'flex', gap: 4, zIndex: 10 }}>
          <button onClick={() => setZoom(z => Math.min(3, z + 0.15))} style={{ width: 34, height: 34, background: 'var(--panel)', border: '1px solid var(--border)', color: 'var(--gold)', fontSize: '1.25rem', borderRadius: 2, cursor: 'pointer' }}>+</button>
          <button onClick={() => setZoom(1.0)} style={{ padding: '0 12px', height: 34, background: 'var(--panel)', border: '1px solid var(--border)', color: 'var(--text-dim)', fontSize: '0.875rem', borderRadius: 2, cursor: 'pointer', fontFamily: 'Cinzel, serif' }}>{Math.round(zoom * 100)}%</button>
          <button onClick={() => setZoom(z => Math.max(0.2, z - 0.15))} style={{ width: 34, height: 34, background: 'var(--panel)', border: '1px solid var(--border)', color: 'var(--gold)', fontSize: '1.25rem', borderRadius: 2, cursor: 'pointer' }}>−</button>
        </div>

        {/* Grid size indicator */}
        <div style={{ position: 'absolute', top: 10, right: 14, fontFamily: 'Cinzel, serif', fontSize: '0.875rem', color: 'var(--text-faint)', zIndex: 10 }}>
          {MAP_COLS} × {MAP_ROWS}
        </div>
      </div>
    </div>
  )
}

function Badge({ children, gold, green, red, blue, muted }) {
  const color  = gold ? 'var(--gold)' : green ? '#6aaf6a' : red ? '#e08080' : blue ? '#90c0ff' : 'var(--text-muted)'
  const border = gold ? '#c8a84b55'   : green ? '#2a5020' : red ? '#5a1a1a' : blue ? '#2a4060' : 'var(--border)'
  const bg     = gold ? '#1e1800'     : green ? '#0a140a' : red ? '#140a0a' : blue ? '#0a1020' : 'var(--panel-alt)'
  return (
    <span style={{ fontSize: '0.875rem', padding: '2px 7px', background: bg, border: `1px solid ${border}`, color, borderRadius: 2, fontFamily: 'Cinzel, serif' }}>
      {children}
    </span>
  )
}
