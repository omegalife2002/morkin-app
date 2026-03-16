import { WEATHER_TABLE } from '../data/gameData'
import { MiniBtn } from './UI'

const QUARTER_NAMES = ['Morning', 'Afternoon', 'Evening', 'Night']

export default function TurnTracker({
  day, quarter, iceFear, weather,
  advanceQuarter, rollWeather,
  setDay, setQuarter, setIceFear,
}) {
  const weatherText = weather ? WEATHER_TABLE[weather.roll] : null

  const label = {
    fontFamily: 'Cinzel, serif', fontSize: '0.875rem',
    letterSpacing: 1, color: 'var(--text-muted)',
    textTransform: 'uppercase', marginBottom: 4, display: 'block',
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 24,
      padding: '10px 20px',
      background: '#0b0b10',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0, flexWrap: 'wrap',
    }}>

      {/* Day */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div>
          <span style={label}>Day</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
            <span style={{ fontFamily: 'Cinzel, serif', fontSize: '1.6rem', color: 'var(--gold)', lineHeight: 1 }}>{day}</span>
            <span style={{ fontFamily: 'Cinzel, serif', fontSize: '1rem', color: 'var(--text-muted)' }}>/30</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 2, alignSelf: 'flex-end', paddingBottom: 2 }}>
          <MiniBtn onClick={() => setDay(Math.max(1, day - 1))}>−</MiniBtn>
          <MiniBtn onClick={() => setDay(Math.min(30, day + 1))} positive>+</MiniBtn>
        </div>
      </div>

      <div style={{ width: 1, height: 36, background: 'var(--border)' }} />

      {/* Quarters */}
      <div>
        <span style={label}>Quarter</span>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {QUARTER_NAMES.map((name, i) => (
            <button
              key={name}
              onClick={() => setQuarter(i + 1)}
              title={name}
              style={{
                width: 16, height: 16, borderRadius: '50%',
                border: `1px solid ${i < quarter ? 'var(--gold)' : 'var(--border)'}`,
                background: i < quarter ? 'var(--gold)' : 'var(--panel-alt)',
                cursor: 'pointer', transition: 'all 0.15s', padding: 0,
              }}
            />
          ))}
          <span style={{ fontFamily: 'Cinzel, serif', fontSize: '1rem', color: 'var(--text-dim)', marginLeft: 4 }}>
            {QUARTER_NAMES[quarter - 1]}
          </span>
        </div>
      </div>

      <div style={{ width: 1, height: 36, background: 'var(--border)' }} />

      {/* Ice Fear */}
      <div>
        <span style={label}>Ice Fear</span>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {[1, 2, 3].map(n => (
            <button
              key={n}
              onClick={() => setIceFear(n)}
              style={{
                width: 22, height: 22, borderRadius: '50%',
                border: `1px solid ${n <= iceFear ? '#8ab0e8' : 'var(--border)'}`,
                background: n <= iceFear ? '#3a4a7a' : 'var(--panel-alt)',
                cursor: 'pointer', fontSize: '0.875rem',
                color: n <= iceFear ? '#c8deff' : 'transparent',
                boxShadow: n <= iceFear ? '0 0 8px #4a5a8b' : 'none',
                transition: 'all 0.2s', padding: 0, lineHeight: 1,
              }}
            >
              {n <= iceFear ? '❄' : ''}
            </button>
          ))}
          <span style={{ fontFamily: 'Cinzel, serif', fontSize: '1rem', color: iceFear === 3 ? '#9ab0e8' : 'var(--text-dim)', marginLeft: 4 }}>
            Level {iceFear}
          </span>
        </div>
      </div>

      <div style={{ width: 1, height: 36, background: 'var(--border)' }} />

      {/* Weather */}
      <div>
        <span style={label}>Weather</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={rollWeather}
            style={{
              padding: '4px 12px', fontFamily: 'Cinzel, serif', fontSize: '1rem',
              background: 'var(--panel-alt)', border: '1px solid var(--border)',
              color: 'var(--text-dim)', cursor: 'pointer', borderRadius: 2, letterSpacing: 0.5,
            }}
          >
            Roll D10
          </button>
          {weatherText && (
            <span style={{ fontSize: '1rem', color: '#8ab8d8', fontStyle: 'italic', maxWidth: 280 }}>
              <strong style={{ fontFamily: 'Cinzel, serif', color: 'var(--gold)', marginRight: 6 }}>{weather.roll}</strong>
              {weatherText}
            </span>
          )}
        </div>
      </div>

      {/* Advance */}
      <button
        onClick={advanceQuarter}
        style={{
          marginLeft: 'auto', padding: '6px 16px',
          fontFamily: 'Cinzel, serif', fontSize: '1rem', letterSpacing: 1,
          background: 'var(--panel-alt)', border: '1px solid var(--gold-dim)',
          color: 'var(--gold)', cursor: 'pointer', borderRadius: 2,
          transition: 'all 0.15s',
        }}
      >
        + Next Quarter
      </button>
    </div>
  )
}
