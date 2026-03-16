import { useState } from 'react'
import { useGameState } from './hooks/useGameState'
import TurnTracker from './components/TurnTracker'
import HexMap from './components/HexMap'
import CharacterSheet from './components/CharacterSheet'

const NAV = [
  { id: 'map',       label: '⬡  Map' },
  { id: 'character', label: '✦  Character' },
]

export default function App() {
  const [view, setView] = useState('map')
  const game = useGameState()

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', width: '100vw',
      overflow: 'hidden',
      background: 'var(--dark)',
    }}>

      {/* ── App header / nav ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '0 20px',
        background: '#0a0a0f',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        height: 48,
        gap: 8,
      }}>
        {/* Logo */}
        <div style={{ marginRight: 20 }}>
          <span style={{ fontFamily: 'Cinzel, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--gold)', letterSpacing: 3 }}>
            MORKIN
          </span>
          <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: 2, marginLeft: 10 }}>
            THE LORDS OF MIDNIGHT
          </span>
        </div>

        {/* Nav */}
        <div style={{ display: 'flex', gap: 2 }}>
          {NAV.map(n => (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              style={{
                padding: '0 16px', height: 48,
                background: 'none', border: 'none',
                fontFamily: 'Cinzel, serif', fontSize: '1rem', letterSpacing: 1,
                cursor: 'pointer',
                color: view === n.id ? 'var(--gold)' : 'var(--text-dim)',
                borderBottom: `2px solid ${view === n.id ? 'var(--gold)' : 'transparent'}`,
                transition: 'color 0.2s, border-color 0.2s',
              }}
            >
              {n.label}
            </button>
          ))}
        </div>

        {/* Save controls */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontStyle: 'italic', fontFamily: 'IM Fell English, serif' }}>
            Auto-saved
          </span>
          <button onClick={game.exportSave} style={navBtn}>Export Save</button>
          <label style={{ ...navBtn, display: 'inline-block' }}>
            Import Save
            <input type="file" accept=".json" style={{ display: 'none' }}
              onChange={e => e.target.files[0] && game.importSave(e.target.files[0])} />
          </label>
          <button onClick={game.resetAll} style={{ ...navBtn, border: '1px solid #5a2020', color: '#e07070' }}>Reset</button>
        </div>
      </div>

      {/* ── Turn tracker ── */}
      <TurnTracker
        day={game.day}
        quarter={game.quarter}
        iceFear={game.iceFear}
        weather={game.weather}
        advanceQuarter={game.advanceQuarter}
        rollWeather={game.rollWeather}
        setDay={game.setDay}
        setQuarter={game.setQuarter}
        setIceFear={game.setIceFear}
      />

      {/* ── Main view ── */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {view === 'map' && (
          <HexMap
            grid={game.grid}
            updateHex={game.updateHex}
            movePlayer={game.movePlayer}
          />
        )}
        {view === 'character' && (
          <CharacterSheet
            char={game.char}
            rollLog={game.rollLog}
            setChar={game.setChar}
            setAttr={game.setAttr}
            adjustHp={game.adjustHp}
            adjustFatigue={game.adjustFatigue}
            setSkillBonus={game.setSkillBonus}
            toggleCondition={game.toggleCondition}
            toggleCompanion={game.toggleCompanion}
            adjustCompanionHp={game.adjustCompanionHp}
            updateInventorySlot={game.updateInventorySlot}
            addRollLog={game.addRollLog}
          />
        )}
      </div>
    </div>
  )
}

const navBtn = {
  padding: '5px 12px', fontFamily: 'Cinzel, serif', fontSize: '1rem',
  background: 'var(--panel)', border: '1px solid var(--border)',
  color: 'var(--text-dim)', cursor: 'pointer', borderRadius: 2, letterSpacing: 0.5,
}
