// ── Stat bar ────────────────────────────────────────────────────────────────
export function StatBar({ current, max, color, label, onInc, onDec, onSet, compact }) {
  const pct      = Math.max(0, Math.min(100, (current / max) * 100))
  const barColor = pct < 20 ? '#d04040' : pct < 40 ? '#c07030' : color

  return (
    <div>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <span style={{ fontSize: '0.875rem', fontFamily: 'Cinzel, serif', letterSpacing: 1, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</span>
          <span style={{ fontSize: compact ? '1rem' : '1.1rem', fontFamily: 'Cinzel, serif', color: barColor }}>
            {current}<span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>/{max}</span>
          </span>
        </div>
      )}
      <div style={{
        position: 'relative', height: compact ? 6 : 10,
        background: '#0a0a0e', borderRadius: 1, overflow: 'hidden',
        border: '1px solid var(--border-dim)',
      }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, height: '100%',
          width: `${pct}%`, background: barColor,
          transition: 'width 0.3s, background 0.3s',
          boxShadow: `0 0 8px ${barColor}50`,
        }} />
        {!compact && Array.from({ length: Math.floor(max / 10) - 1 }, (_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${((i + 1) / (max / 10)) * 100}%`,
            top: 0, bottom: 0, width: 1,
            background: '#06060a', opacity: 0.6,
          }} />
        ))}
      </div>
      {!compact && onInc && (
        <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
          {[1, 5].map(n => <MiniBtn key={`-${n}`} onClick={() => onDec(n)}>−{n}</MiniBtn>)}
          {[1, 5].map(n => <MiniBtn key={`+${n}`} onClick={() => onInc(n)} positive>+{n}</MiniBtn>)}
          {onSet && (
            <input
              type="number"
              defaultValue={current}
              onBlur={e => onSet(Number(e.target.value))}
              style={{
                width: 50, background: '#0a0a0e', border: '1px solid var(--border-dim)',
                color: 'var(--text-dim)', fontFamily: 'Cinzel, serif', fontSize: '1rem',
                padding: '1px 4px', textAlign: 'center', borderRadius: 2,
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ── Mini button ─────────────────────────────────────────────────────────────
export function MiniBtn({ children, onClick, positive, danger, style: extraStyle }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '2px 8px',
        background: '#0e0e14',
        border: '1px solid var(--border)',
        color: danger ? '#e07070' : positive ? '#7ac87a' : 'var(--text-dim)',
        fontSize: '1rem',
        cursor: 'pointer',
        fontFamily: 'Cinzel, serif',
        borderRadius: 2,
        transition: 'border-color 0.1s',
        lineHeight: 1.4,
        ...extraStyle,
      }}
    >
      {children}
    </button>
  )
}

// ── Counter with +/− ────────────────────────────────────────────────────────
export function Counter({ value, onChange, min = 0, max = 9999, color = 'var(--gold)', label, icon }) {
  return (
    <div style={{ background: 'var(--panel-alt)', border: '1px solid var(--border-dim)', padding: '8px 10px' }}>
      {(label || icon) && (
        <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.875rem', color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' }}>
          {icon} {label}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <MiniBtn onClick={() => onChange(Math.max(min, value - 1))} style={{ fontSize: '1.1rem', padding: '1px 9px' }}>−</MiniBtn>
        <span style={{ fontFamily: 'Cinzel, serif', fontSize: '1.4rem', color, minWidth: 34, textAlign: 'center', lineHeight: 1 }}>{value}</span>
        <MiniBtn onClick={() => onChange(Math.min(max, value + 1))} positive style={{ fontSize: '1.1rem', padding: '1px 9px' }}>+</MiniBtn>
      </div>
    </div>
  )
}

// ── Section title ────────────────────────────────────────────────────────────
export function SectionTitle({ children, right }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      fontFamily: 'Cinzel, serif', fontSize: '0.875rem', letterSpacing: 2,
      color: 'var(--text-muted)', textTransform: 'uppercase',
      borderBottom: '1px solid var(--border-dim)',
      paddingBottom: 5, marginBottom: 12,
    }}>
      <span>{children}</span>
      {right && <span style={{ fontSize: '0.875rem', color: 'var(--text-dim)', fontStyle: 'italic', textTransform: 'none', letterSpacing: 0 }}>{right}</span>}
    </div>
  )
}

// ── Tab bar ──────────────────────────────────────────────────────────────────
export function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--border-dim)', background: 'var(--panel-alt)', flexShrink: 0 }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            flex: 1, padding: '10px 4px',
            background: 'none', border: 'none',
            fontFamily: 'Cinzel, serif', fontSize: '0.875rem', letterSpacing: 1.5,
            cursor: 'pointer',
            color: active === t.id ? 'var(--gold)' : 'var(--text-muted)',
            borderBottom: `2px solid ${active === t.id ? 'var(--gold)' : 'transparent'}`,
            transition: 'color 0.2s, border-color 0.2s',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ── Ornament divider ─────────────────────────────────────────────────────────
export function Ornament() {
  return (
    <div style={{ textAlign: 'center', color: 'var(--gold)', opacity: 0.25, fontSize: '1rem', margin: '10px 0', userSelect: 'none' }}>
      ✦ ─── ✦ ─── ✦
    </div>
  )
}
