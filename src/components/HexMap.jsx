import { useState, useCallback } from 'react'
import { TERRAIN, SITES, SPECIAL_SITES, TRAVEL_REF, MAP_COLS, MAP_ROWS, HEX_SIZE } from '../data/gameData'
import { MiniBtn, SectionTitle } from './UI'

const HEX_H = Math.sqrt(3) * HEX_SIZE

function hexToPixel(col, row) {
  return {
    x: HEX_SIZE * 1.5 * col,
    y: HEX_H * (row + (col % 2 === 0 ? 0 : 0.5)),
  }
}

function hexCornerPoints(cx, cy, size) {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (60 * i - 30)
    return `${cx + size * Math.cos(angle)},${cy + size * Math.sin(angle)}`
  }).join(' ')
}

function HexCell({ col, row, cell, isSelected, onClick }) {
  const { x, y } = hexToPixel(col, row)
  const cx = x + HEX_SIZE
  const cy = y + HEX_H / 2
  const pts = hexCornerPoints(cx, cy, HEX_SIZE - 1.5)
  const t = TERRAIN[cell.terrain]
  const s = SITES[cell.site]

  const strokeColor = isSelected ? '#d4b45a' : cell.playerHere ? '#e8d07a' : t.stroke
  const strokeWidth = isSelected ? 2.5 : cell.playerHere ? 2 : 1

  return (
    <g onClick={() => onClick(col, row)} style={{ cursor: 'pointer' }}>
      <polygon points={pts} fill={t.color} stroke={strokeColor} strokeWidth={strokeWidth} />
      {!cell.explored && (
        <polygon points={pts} fill="#050608" opacity={0.75} />
      )}
      {cell.site !== 'none' && cell.explored && (
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
          fontSize={14} style={{ userSelect: 'none', filter: 'drop-shadow(0 0 3px #000)' }}>
          {s.glyph}
        </text>
      )}
      {cell.playerHere && (
        <>
          <circle cx={cx} cy={cy - (cell.site !== 'none' ? 14 : 0)} r={5} fill="#e8d07a" opacity={0.95} />
          <circle cx={cx} cy={cy - (cell.site !== 'none' ? 14 : 0)} r={8} fill="none" stroke="#e8d07a" strokeWidth={1.2} opacity={0.4} />
        </>
      )}
      {cell.explored && (
        <text x={cx} y={cy + HEX_SIZE - 10} textAnchor="middle" fontSize={7} fill="#ffffff18" style={{ userSelect: 'none' }}>
          {col},{row}
        </text>
      )}
      {cell.questedHere && cell.explored && (
        <text x={cx - 13} y={cy - HEX_SIZE + 14} fontSize={9} fill="#e06060" opacity={0.9} style={{ userSelect: 'none' }}>⚔</text>
      )}
      {cell.notes && cell.explored && (
        <text x={cx + 10} y={cy - HEX_SIZE + 14} fontSize={9} fill="#8ac0ff" opacity={0.9} style={{ userSelect: 'none' }}>✎</text>
      )}
    </g>
  )
}

export default function HexMap({ grid, updateHex, movePlayer }) {
  const [selected, setSelected] = useState('2,6')
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState(null)
  const [notesText, setNotesText] = useState(grid['2,6']?.notes || '')
  const [hexPanel, setHexPanel] = useState('terrain')

  const selCell = grid[selected]

  const handleHexClick = useCallback((col, row) => {
    const key = `${col},${r}`
    setSelected(key)
    setNotesText(grid[key]?.notes || '')
  }, [grid])

  const handleHexClickFixed = useCallback((col, row) => {
    const key = `${col},${row}`
    setSelected(key)
    setNotesText(grid[key]?.notes || '')
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

  const svgW = MAP_COLS * HEX_SIZE * 1.5 + HEX_SIZE * 2
  const svgH = MAP_ROWS * HEX_H + HEX_H
  const travel = selCell ? TRAVEL_REF[selCell.terrain] : null

  const panelTabStyle = (active) => ({
    flex: 1, padding: '10px 4px',
    background: 'none', border: 'none',
    fontFamily: 'Cinzel, serif', fontSize: '0.85rem', letterSpacing: 1,
    cursor: 'pointer',
    color: active ? 'var(--gold)' : 'var(--text-muted)',
    borderBottom: `2px solid ${active ? 'var(--gold)' : 'transparent'}`,
    textTransform: 'uppercase',
  })

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── Side panel ── */}
      <div style={{
        width: 300, flexShrink: 0,
        background: 'var(--panel)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Panel tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-dim)', background: 'var(--panel-alt)' }}>
          {['terrain', 'site', 'notes'].map(t => (
            <button key={t} onClick={() => setHexPanel(t)} style={panelTabStyle(hexPanel === t)}>{t}</button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
          {selCell && (
            <>
              {/* Hex identity */}
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontFamily: 'Cinzel, serif', fontSize: '1.1rem', color: 'var(--gold)', letterSpacing: 1 }}>
                  Hex {selected}
                </span>
                <div style={{ display: 'flex', gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
                  {selCell.playerHere  && <Badge gold>You Are Here</Badge>}
                  {selCell.explored    && <Badge green>Explored</Badge>}
                  {!selCell.explored   && <Badge muted>Unknown</Badge>}
                  {selCell.questedHere && <Badge red>⚔ Quested</Badge>}
                  {selCell.soughtHere  && <Badge blue>🔍 Sought</Badge>}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 5, marginBottom: 14, flexWrap: 'wrap' }}>
                <MiniBtn onClick={() => movePlayer(selected)} style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
                  ⬡ Move Here
                </MiniBtn>
                <MiniBtn onClick={() => updateHex(selected, { explored: !selCell.explored })}>
                  {selCell.explored ? '✗ Unexplore' : '✓ Explore'}
                </MiniBtn>
                <MiniBtn onClick={() => updateHex(selected, { questedHere: !selCell.questedHere })}>⚔ Quest</MiniBtn>
                <MiniBtn onClick={() => updateHex(selected, { soughtHere: !selCell.soughtHere })}>🔍 Seek</MiniBtn>
              </div>

              {/* TERRAIN */}
              {hexPanel === 'terrain' && (
                <>
                  <SectionTitle>Terrain</SectionTitle>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                    {Object.entries(TERRAIN).filter(([k]) => k !== 'unknown').map(([k, v]) => (
                      <button
                        key={k}
                        onClick={() => updateHex(selected, { terrain: k, explored: true })}
                        style={{
                          padding: '5px 12px', borderRadius: 20, fontSize: '1rem',
                          background: selCell.terrain === k ? v.color : 'var(--panel-alt)',
                          border: `1px solid ${selCell.terrain === k ? v.stroke : 'var(--border)'}`,
                          color: selCell.terrain === k ? '#e0d0b0' : 'var(--text-dim)',
                          fontFamily: 'Cinzel, serif', cursor: 'pointer', letterSpacing: 0.5,
                          transition: 'all 0.15s',
                        }}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                  {travel && selCell.terrain !== 'unknown' && (
                    <div style={{ background: 'var(--panel-alt)', border: '1px solid var(--border-dim)', padding: 12, borderRadius: 2 }}>
                      <SectionTitle>Travel Reference</SectionTitle>
                      {selCell.terrain === 'wastes' ? (
                        <div style={{ color: '#e06060', fontFamily: 'Cinzel, serif', fontSize: '1rem' }}>⛔ IMPASSABLE — Frozen Wastes</div>
                      ) : (
                        <>
                          <div style={{ color: 'var(--text)', marginBottom: 3, fontSize: '1rem' }}>🐎 {travel.horse}</div>
                          <div style={{ color: 'var(--text)', marginBottom: 8, fontSize: '1rem' }}>👣 {travel.walk}</div>
                          <div style={{ color: 'var(--text-dim)', fontSize: '1rem' }}>
                            Fatigue: <strong>{travel.fatigueHorse}</strong> on horse · <strong>{travel.fatigueWalk}</strong> on foot
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* SITE */}
              {hexPanel === 'site' && (
                <>
                  <SectionTitle>Site Type</SectionTitle>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 14 }}>
                    {Object.entries(SITES).map(([k, v]) => (
                      <button
                        key={k}
                        onClick={() => updateHex(selected, { site: k })}
                        style={{
                          padding: '6px 8px', textAlign: 'left',
                          background: selCell.site === k ? '#1e1800' : 'var(--panel-alt)',
                          border: `1px solid ${selCell.site === k ? 'var(--gold)' : 'var(--border)'}`,
                          color: v.dark ? '#e08080' : 'var(--text-dim)',
                          fontFamily: 'Cinzel, serif', fontSize: '0.9rem', cursor: 'pointer',
                          borderRadius: 2, display: 'flex', alignItems: 'center', gap: 6,
                          letterSpacing: 0.5,
                        }}
                      >
                        <span style={{ fontSize: '1rem' }}>{v.glyph}</span>
                        <span>{v.label}</span>
                      </button>
                    ))}
                  </div>
                  <SectionTitle>Special Site #</SectionTitle>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      value={selCell.specialSite || ''}
                      onChange={e => updateHex(selected, { specialSite: e.target.value })}
                      placeholder="1–12"
                      style={{
                        width: 56, background: '#0a0a0e',
                        border: '1px solid var(--border)', color: 'var(--text)',
                        fontFamily: 'Cinzel, serif', fontSize: '1rem', padding: '4px 8px',
                        borderRadius: 2,
                      }}
                    />
                    {selCell.specialSite && SPECIAL_SITES[selCell.specialSite] && (
                      <span style={{ fontSize: '1rem', color: '#8ab8d8', fontStyle: 'italic' }}>
                        {SPECIAL_SITES[selCell.specialSite]}
                      </span>
                    )}
                  </div>
                </>
              )}

              {/* NOTES */}
              {hexPanel === 'notes' && (
                <>
                  <SectionTitle>Hex Notes</SectionTitle>
                  <textarea
                    value={notesText}
                    onChange={e => setNotesText(e.target.value)}
                    onBlur={() => updateHex(selected, { notes: notesText })}
                    placeholder="Record events, encounters, finds…"
                    rows={7}
                    style={{
                      width: '100%', background: '#0a0a0e',
                      border: '1px solid var(--border)', color: 'var(--text)',
                      fontFamily: 'IM Fell English, serif', fontSize: '1rem',
                      padding: 10, resize: 'none', borderRadius: 2, lineHeight: 1.6,
                    }}
                  />
                </>
              )}
            </>
          )}
        </div>

        {/* Legend */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-dim)', background: 'var(--panel-alt)' }}>
          <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.8rem', color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>Terrain</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {Object.entries(TERRAIN).filter(([k]) => k !== 'unknown').map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 12, height: 12, background: v.color, border: `1px solid ${v.stroke}`, borderRadius: 2, flexShrink: 0 }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{v.label}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 6, fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Right-drag or middle-drag to pan
          </div>
        </div>
      </div>

      {/* ── Map canvas ── */}
      <div
        style={{ flex: 1, overflow: 'hidden', position: 'relative', background: '#06060a', cursor: dragStart ? 'grabbing' : 'default' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={e => e.preventDefault()}
      >
        <div style={{ overflow: 'auto', width: '100%', height: '100%' }}>
          <svg
            width={svgW + 20}
            height={svgH + 20}
            style={{ display: 'block', transform: `translate(${offset.x}px, ${offset.y}px)` }}
          >
            <rect width={svgW + 20} height={svgH + 20} fill="#06060a" />
            <g transform="translate(10,10)">
              {Array.from({ length: MAP_COLS }, (_, c) =>
                Array.from({ length: MAP_ROWS }, (_, r) => {
                  const key = `${c},${r}`
                  return (
                    <HexCell
                      key={key} col={c} row={r}
                      cell={grid[key]}
                      isSelected={selected === key}
                      onClick={handleHexClickFixed}
                    />
                  )
                })
              )}
            </g>
          </svg>
        </div>
      </div>
    </div>
  )
}

function Badge({ children, gold, green, red, blue, muted }) {
  const color  = gold ? 'var(--gold)' : green ? '#7ac87a' : red ? '#e07070' : blue ? '#8ab8ff' : 'var(--text-muted)'
  const border = gold ? 'var(--gold-dim)' : green ? '#2a5020' : red ? '#5a1818' : blue ? '#2a4060' : 'var(--border)'
  const bg     = gold ? '#1e1800' : green ? '#0a140a' : red ? '#140808' : blue ? '#0a1020' : 'var(--panel-alt)'
  return (
    <span style={{
      fontSize: '0.85rem', padding: '2px 8px',
      background: bg, border: `1px solid ${border}`,
      color, borderRadius: 2, fontFamily: 'Cinzel, serif', letterSpacing: 0.5,
    }}>{children}</span>
  )
}
