import { useState } from 'react'
import {
  SKILLS_DEF, MASTERIES, COMPANIONS, CONDITIONS,
  WEAPONS, ARMOUR, deriveStats,
} from '../data/gameData'
import { StatBar, MiniBtn, Counter, SectionTitle, TabBar, Ornament } from './UI'

const CHAR_TABS = [
  { id: 'core',       label: 'Core' },
  { id: 'skills',     label: 'Skills' },
  { id: 'companions', label: 'Party' },
  { id: 'gear',       label: 'Gear' },
  { id: 'journal',    label: 'Journal' },
]

// ── Attribute block ───────────────────────────────────────────────────────────
function AttrBlock({ label, value, onChange, sub }) {
  return (
    <div style={{
      background: 'var(--panel-alt)', border: '1px solid var(--border)',
      padding: '12px 10px', textAlign: 'center', flex: '1 1 0',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 50% 0%, #d4b45a0a 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.8rem', letterSpacing: 2, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: 'Cinzel, serif', fontSize: '2rem', color: 'var(--gold)', lineHeight: 1, marginBottom: 6, textShadow: '0 0 14px #d4b45a30' }}>{value}</div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 5 }}>
        <MiniBtn onClick={() => onChange(value - 1)}>−</MiniBtn>
        <MiniBtn onClick={() => onChange(value + 1)} positive>+</MiniBtn>
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: 6, fontStyle: 'italic' }}>{sub}</div>
    </div>
  )
}

// ── Skill row ─────────────────────────────────────────────────────────────────
function SkillRow({ skill, value, bonusVal, onBonusChange, onRoll }) {
  const [lastResult, setLastResult] = useState(null)

  const roll = () => {
    const r       = Math.floor(Math.random() * 100) + 1
    const success  = r <= value
    const critical = r < 5 && success
    const fumble   = r > 95 && !success
    setLastResult({ r, success, critical, fumble })
    onRoll({ label: skill.label, roll: r, skill: value, success, critical, fumble })
  }

  const res = lastResult
  const btnColor  = res ? res.critical ? '#90e890' : res.fumble ? '#e89090' : res.success ? '#7ac87a' : '#e07070' : 'var(--text-dim)'
  const btnBorder = res ? res.critical ? '#3a7020' : res.fumble ? '#7a2020' : res.success ? '#2a5020' : '#5a1a1a' : 'var(--border)'
  const btnBg     = res ? res.critical ? '#0c1a08' : res.fumble ? '#1a0808' : res.success ? '#0a140a' : '#140a0a' : 'var(--panel-alt)'

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '150px 50px 50px 44px 1fr 96px',
      alignItems: 'center', gap: 6,
      padding: '5px 10px',
      borderBottom: '1px solid #120f08',
    }}>
      <span style={{ fontSize: '1rem', color: 'var(--text)' }}>{skill.label}</span>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', fontFamily: 'Cinzel, serif' }}>
        {skill.attr.join('/')}
      </span>
      <span style={{
        fontFamily: 'Cinzel, serif', fontSize: '1.1rem', textAlign: 'center',
        color: value >= 60 ? 'var(--gold)' : value >= 40 ? 'var(--text)' : 'var(--text-dim)',
      }}>{value}</span>
      <input
        type="number"
        value={bonusVal}
        onChange={e => onBonusChange(Number(e.target.value))}
        title="Extra distributed points"
        style={{
          width: 40, background: '#0a0a0e',
          border: '1px solid var(--border-dim)',
          color: '#8ab8ff', fontFamily: 'Cinzel, serif', fontSize: '1rem',
          padding: '2px 4px', textAlign: 'center', borderRadius: 2,
        }}
      />
      <div style={{ height: 6, background: '#0a0a0e', borderRadius: 1, overflow: 'hidden', border: '1px solid var(--border-dim)' }}>
        <div style={{
          height: '100%', width: `${Math.min(100, value)}%`,
          background: value >= 70 ? 'var(--gold)' : value >= 50 ? '#7a9060' : '#4a5848',
          transition: 'width 0.3s',
        }} />
      </div>
      <button
        onClick={roll}
        style={{
          padding: '3px 6px',
          background: btnBg, border: `1px solid ${btnBorder}`,
          color: btnColor, fontFamily: 'Cinzel, serif', fontSize: '0.9rem',
          cursor: 'pointer', borderRadius: 2, transition: 'all 0.15s',
          minWidth: 90, textAlign: 'center',
        }}
      >
        {res
          ? `${res.critical ? '⭐' : res.fumble ? '💀' : res.success ? '✓' : '✗'} ${res.r}`
          : 'Roll D100'}
      </button>
    </div>
  )
}

// ── Main CharacterSheet ───────────────────────────────────────────────────────
export default function CharacterSheet({
  char, rollLog,
  setChar, setAttr, adjustHp, adjustFatigue, setSkillBonus,
  toggleCondition, toggleCompanion, adjustCompanionHp, updateInventorySlot,
  addRollLog,
}) {
  const [tab, setTab] = useState('core')
  const derived     = deriveStats(char)
  const maxFatigue  = derived.maxFatigue
  const isExhausted = char.fatigue.current >= maxFatigue

  const activeComps = COMPANIONS.filter(c => char.companions[c.id])
  const compMel     = activeComps.reduce((s, c) => s + c.mel, 0)
  const compDef     = activeComps.reduce((s, c) => s + c.def, 0)
  const totalMelee   = Math.min(99, derived.skills.melee   + compMel)
  const totalDefence = Math.min(99, derived.skills.defence + compDef)
  const totalDefVal  = Math.floor(totalDefence / 2)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{
        padding: '18px 22px 14px',
        background: 'linear-gradient(180deg, #0e0e14 0%, #09090d 100%)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          {/* Name + mastery */}
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.8rem', letterSpacing: 3, color: 'var(--text-muted)', marginBottom: 4 }}>
              ✦ Character Scroll ✦
            </div>
            <input
              type="text"
              value={char.name}
              onChange={e => setChar(c => ({ ...c, name: e.target.value }))}
              style={{
                background: 'none', border: 'none', outline: 'none',
                fontFamily: 'Cinzel, serif', fontSize: '2rem', fontWeight: 700,
                color: 'var(--gold)', letterSpacing: 2, width: '100%',
                textShadow: '0 0 20px #d4b45a20',
              }}
            />
            <div style={{ fontSize: '1rem', color: 'var(--text-dim)', fontStyle: 'italic', marginBottom: 10 }}>
              Half-human, half-Fey · Bearer of the Moon's Hope
            </div>
            <select
              value={char.mastery}
              onChange={e => setChar(c => ({ ...c, mastery: e.target.value }))}
              style={{
                background: 'var(--panel-alt)', border: '1px solid #3a3020',
                color: 'var(--gold)', fontFamily: 'Cinzel, serif', fontSize: '1rem',
                padding: '5px 12px', borderRadius: 2, cursor: 'pointer',
              }}
            >
              {MASTERIES.map(m => (
                <option key={m.id} value={m.id}>
                  {m.label}{m.extra ? ` — starts with ${m.extra}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* HP / Fatigue / XP */}
          <div style={{ minWidth: 240 }}>
            <StatBar
              current={char.hp.current} max={char.hp.max} color="#d04040" label="Health Points"
              onInc={n => adjustHp(n)} onDec={n => adjustHp(-n)} onSet={v => adjustHp(0, v)}
            />
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.8rem', letterSpacing: 1, color: isExhausted ? '#b070d8' : 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Fatigue {isExhausted ? '— Exhausted!' : ''}
                </span>
                <span style={{ fontFamily: 'Cinzel, serif', fontSize: '1rem', color: isExhausted ? '#b070d8' : 'var(--text-dim)' }}>
                  {char.fatigue.current}<span style={{ color: 'var(--text-faint)', fontSize: '0.85rem' }}>/{maxFatigue}</span>
                </span>
              </div>
              <div style={{ height: 8, background: '#0a0a0e', border: '1px solid var(--border-dim)', borderRadius: 1, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, (char.fatigue.current / maxFatigue) * 100)}%`,
                  background: isExhausted ? '#9060c0' : '#6050a0',
                  transition: 'width 0.3s, background 0.3s',
                }} />
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                {[1, 2, 4].map(n => <MiniBtn key={n} onClick={() => adjustFatigue(n)}>+{n}</MiniBtn>)}
                <MiniBtn onClick={() => adjustFatigue(-1)} positive>−1</MiniBtn>
                <MiniBtn onClick={() => adjustFatigue(0, 0)} style={{ color: '#6ab0c8' }}>Reset</MiniBtn>
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontFamily: 'Cinzel, serif', fontSize: '0.8rem', letterSpacing: 1, color: 'var(--text-muted)', textTransform: 'uppercase' }}>XP</span>
                <span style={{ fontFamily: 'Cinzel, serif', fontSize: '1rem', color: '#8070c0' }}>{char.xp}</span>
              </div>
              <div style={{ height: 6, background: '#0a0a0e', border: '1px solid var(--border-dim)', borderRadius: 1, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(char.xp % 20) / 20 * 100}%`, background: '#6050a0', transition: 'width 0.4s' }} />
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 4, alignItems: 'center' }}>
                {[1, 3, 5, 10].map(n => (
                  <MiniBtn key={n} onClick={() => setChar(c => ({ ...c, xp: c.xp + n }))}>+{n}</MiniBtn>
                ))}
                <span style={{ fontSize: '1rem', color: 'var(--text-dim)', marginLeft: 4 }}>
                  {20 - (char.xp % 20)} to +1 attr
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Conditions + horse */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          {CONDITIONS.map(c => (
            <button
              key={c.id}
              onClick={() => toggleCondition(c.id)}
              title={c.desc}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                border: `1px solid ${char.conditions[c.id] ? c.color : 'var(--border)'}`,
                borderRadius: 2, cursor: 'pointer',
                background: char.conditions[c.id] ? `${c.color}22` : 'var(--panel-alt)',
                fontFamily: 'Cinzel, serif', fontSize: '1rem', letterSpacing: 0.5,
                color: char.conditions[c.id] ? '#e0b898' : 'var(--text-dim)',
                transition: 'all 0.15s',
              }}
            >
              <span>{c.icon}</span>
              <span>{c.label}</span>
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.2rem' }}>{char.hasHorse ? '🐎' : '🦶'}</span>
            <span style={{ fontSize: '1rem', color: 'var(--text-dim)' }}>{char.hasHorse ? 'Has horse' : 'On foot'}</span>
            <MiniBtn onClick={() => setChar(c => ({ ...c, hasHorse: !c.hasHorse }))}>
              {char.hasHorse ? 'Lose Horse' : 'Gain Horse'}
            </MiniBtn>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <TabBar tabs={CHAR_TABS} active={tab} onChange={setTab} />

      {/* ── Content ── */}
      <div className="fade-in" key={tab} style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>

        {/* ═══ CORE ═══ */}
        {tab === 'core' && (
          <>
            <SectionTitle>Attributes</SectionTitle>
            <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
              {[
                { k: 'STR', sub: `Max Fatigue: ${Math.floor(char.attrs.STR/5)}` },
                { k: 'DEX', sub: `Stealth: ${char.attrs.DEX}` },
                { k: 'INT', sub: `Orientation: ${char.attrs.INT}` },
                { k: 'CHA', sub: `Silver start: ${Math.floor(char.attrs.CHA/2)}` },
              ].map(({ k, sub }) => (
                <AttrBlock key={k} label={k} value={char.attrs[k]} onChange={v => setAttr(k, v)} sub={sub} />
              ))}
            </div>

            <SectionTitle>Combat Statistics</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 22 }}>
              {[
                { label: 'Melee',         value: totalMelee,   sub: compMel ? `+${compMel} from party` : 'base skill',     color: '#d04040' },
                { label: 'Defence Skill', value: totalDefence, sub: compDef ? `+${compDef} from party` : 'base skill',     color: '#5090d8' },
                { label: 'Defence Value', value: totalDefVal,  sub: 'blocks incoming hits',                                color: '#7090b8' },
                { label: 'HP Maximum',    value: char.hp.max,  sub: 'adjust with + / −',  color: '#50b050', edit: true },
              ].map(stat => (
                <div key={stat.label} style={{ background: 'var(--panel-alt)', border: '1px solid var(--border)', padding: '12px 14px', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.8rem', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>{stat.label}</div>
                  <div style={{ fontFamily: 'Cinzel, serif', fontSize: '1.8rem', color: stat.color, textShadow: `0 0 10px ${stat.color}30`, lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontStyle: 'italic', marginTop: 4, marginBottom: stat.edit ? 6 : 0 }}>{stat.sub}</div>
                  {stat.edit && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                      <MiniBtn onClick={() => setChar(c => ({ ...c, hp: { ...c.hp, max: Math.max(10, c.hp.max - 1) } }))}>−</MiniBtn>
                      <MiniBtn onClick={() => setChar(c => ({ ...c, hp: { ...c.hp, max: c.hp.max + 1 } }))} positive>+</MiniBtn>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <SectionTitle>Supplies</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 22 }}>
              {[
                { key: 'silver',    icon: '🪙', label: 'Silver',    color: '#d8d0a0' },
                { key: 'rations',   icon: '🍖', label: 'Rations',   color: '#c89860' },
                { key: 'bandages',  icon: '🩹', label: 'Bandages',  color: '#d06888' },
                { key: 'lockpicks', icon: '🗝', label: 'Lockpicks', color: '#b0b080' },
                { key: 'bait',      icon: '🐛', label: 'Bait',      color: '#88b868' },
              ].map(r => (
                <Counter
                  key={r.key} icon={r.icon} label={r.label} color={r.color}
                  value={char[r.key]}
                  onChange={v => setChar(c => ({ ...c, [r.key]: v }))}
                />
              ))}
            </div>

            {rollLog.length > 0 && (
              <>
                <SectionTitle>Recent Rolls</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {rollLog.slice(0, 8).map(r => (
                    <div key={r.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '5px 10px',
                      background: 'var(--panel-alt)', border: '1px solid #120f08', fontSize: '1rem',
                    }}>
                      <span style={{ fontFamily: 'Cinzel, serif', fontSize: '1.2rem', color: r.success ? '#7ac87a' : '#e07070', minWidth: 32 }}>{r.roll}</span>
                      <span style={{ color: 'var(--text-dim)', flex: 1 }}>{r.label}</span>
                      <span style={{ fontSize: '1rem', color: r.critical ? '#90e890' : r.fumble ? '#e89090' : r.success ? '#7ac87a' : '#e07070' }}>
                        {r.critical ? '⭐ Critical' : r.fumble ? '💀 Fumble' : r.success ? '✓ Success' : '✗ Fail'}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* ═══ SKILLS ═══ */}
        {tab === 'skills' && (
          <>
            <SectionTitle right="Blue col = extra points distributed at creation (50 total, max 60)">Skills & Checks</SectionTitle>
            <div style={{
              fontFamily: 'Cinzel, serif', fontSize: '0.8rem', color: 'var(--text-muted)',
              letterSpacing: 1, padding: '3px 10px', marginBottom: 4,
              display: 'grid', gridTemplateColumns: '150px 50px 50px 44px 1fr 96px', gap: 6,
              textTransform: 'uppercase',
            }}>
              <span>Skill</span><span style={{textAlign:'center'}}>Attr</span>
              <span style={{textAlign:'center'}}>Val</span>
              <span style={{textAlign:'center', color:'#8ab8ff'}}>+Pts</span>
              <span/>
              <span/>
            </div>
            <div style={{ border: '1px solid var(--border-dim)', borderRadius: 2, overflow: 'hidden' }}>
              {SKILLS_DEF.map(s => (
                <SkillRow
                  key={s.id} skill={s}
                  value={derived.skills[s.id]}
                  bonusVal={char.skillBonuses[s.id] || 0}
                  onBonusChange={v => setSkillBonus(s.id, v)}
                  onRoll={addRollLog}
                />
              ))}
            </div>
            <div style={{ marginTop: 12, fontSize: '1rem', color: 'var(--text-dim)', fontStyle: 'italic', lineHeight: 1.8 }}>
              Roll ≤ skill value = Success · Roll &lt;5 and succeed = Critical (+1 to that skill) · Roll &gt;95 and fail = Fumble
              <br/>Max 60 at creation · Max 80 during play · Companion/item bonuses can exceed 80
            </div>
          </>
        )}

        {/* ═══ COMPANIONS ═══ */}
        {tab === 'companions' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
              <SectionTitle>Companions</SectionTitle>
              {activeComps.length > 0 && (
                <span style={{ fontSize: '1rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                  Party bonus: Melee +{compMel} · Defence +{compDef}
                </span>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {COMPANIONS.map(comp => {
                const active = !!char.companions[comp.id]
                const compHp = char.companionHp[comp.id] ?? comp.hp
                return (
                  <div
                    key={comp.id}
                    onClick={() => toggleCompanion(comp)}
                    style={{
                      border: `1px solid ${active ? 'var(--gold-dim)' : 'var(--border)'}`,
                      padding: '12px 14px', borderRadius: 2, cursor: 'pointer',
                      background: active ? '#0e0e12' : 'var(--panel-alt)',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontFamily: 'Cinzel, serif', fontSize: '1rem', color: active ? 'var(--gold)' : 'var(--text-dim)' }}>
                        {comp.name}
                      </span>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        {comp.rations > 0 ? `🍖×${comp.rations}` : 'No food'}{comp.auto ? ' · Auto-join' : ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, fontSize: '1rem', color: 'var(--text-dim)', marginBottom: active ? 8 : 0, flexWrap: 'wrap' }}>
                      <span>⚔ +{comp.mel}</span>
                      <span>🛡 +{comp.def}</span>
                      <span>💥 +{comp.dmg}</span>
                      <span>👁 +{comp.per}</span>
                      <span style={{ color: '#8ab8d8', fontStyle: 'italic' }}>+{comp.bonusAmt} {comp.bonusSkill}</span>
                    </div>
                    {active && (
                      <div onClick={e => e.stopPropagation()}>
                        <StatBar
                          current={compHp} max={comp.hp} color="#d04040" label="HP"
                          onInc={n => adjustCompanionHp(comp.id, n, comp.hp)}
                          onDec={n => adjustCompanionHp(comp.id, -n, comp.hp)}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <Ornament />
            <div style={{ fontSize: '1rem', color: 'var(--text-dim)', fontStyle: 'italic', lineHeight: 1.9 }}>
              <strong style={{ fontFamily: 'Cinzel, serif', fontSize: '0.85rem', letterSpacing: 1, color: 'var(--text)', fontStyle: 'normal' }}>RECRUITMENT</strong><br/>
              Approach action (1 quarter) at their Special Site. Roll D6 vs Ice Fear level.<br/>
              Ice Fear 1: fail on 1 · Level 2: fail on 1–2 · Level 3: fail on 1–3<br/>
              Farflame &amp; Fawkrin always join automatically.<br/>
              <strong style={{ color: '#e07070', fontStyle: 'normal' }}>If they refuse, they cannot be approached again.</strong>
            </div>
          </>
        )}

        {/* ═══ GEAR ═══ */}
        {tab === 'gear' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <SectionTitle>Equipped Items</SectionTitle>
              {[
                { key: 'equippedWeapon', label: 'Weapon',  placeholder: 'e.g. Two-Handed Sword (D6+1)' },
                { key: 'equippedArmour', label: 'Armour',  placeholder: 'e.g. Scale Mail (Absorption 2)' },
                { key: 'equippedHelmet', label: 'Helmet',  placeholder: 'e.g. Scale Mail Helmet (Abs 1)' },
              ].map(g => (
                <div key={g.key} style={{ marginBottom: 10 }}>
                  <div style={{ fontFamily: 'Cinzel, serif', fontSize: '0.85rem', letterSpacing: 1, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>{g.label}</div>
                  <input
                    type="text"
                    value={char[g.key] || ''}
                    onChange={e => setChar(c => ({ ...c, [g.key]: e.target.value }))}
                    placeholder={g.placeholder}
                    style={{
                      width: '100%', background: '#0a0a0e',
                      border: '1px solid var(--border)', color: 'var(--text)',
                      fontFamily: 'Cinzel, serif', fontSize: '1rem', padding: '6px 10px', borderRadius: 2,
                    }}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
                {[
                  { key: 'equippedCloak',  label: 'Cloak' },
                  { key: 'equippedAmulet', label: 'Amulet' },
                  { key: 'equippedShield', label: 'Shield' },
                ].map(g => (
                  <label key={g.key} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'Cinzel, serif', fontSize: '1rem', color: char[g.key] ? 'var(--gold)' : 'var(--text-dim)' }}>
                    <input type="checkbox" checked={!!char[g.key]} onChange={e => setChar(c => ({ ...c, [g.key]: e.target.checked }))} style={{ accentColor: 'var(--gold)', width: 14, height: 14 }} />
                    {g.label}
                  </label>
                ))}
              </div>

              <Ornament />
              <SectionTitle>Weapons</SectionTitle>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 52px', gap: '4px 12px' }}>
                {['Weapon','Damage','Price'].map(h => <span key={h} style={{ fontFamily: 'Cinzel, serif', fontSize: '0.8rem', color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase' }}>{h}</span>)}
                {WEAPONS.map(w => [
                  <span key={w.name}  style={{ fontSize: '1rem', color: 'var(--text)',     borderBottom: '1px solid #120f08', paddingBottom: 3 }}>{w.name}</span>,
                  <span key={`${w.name}-d`} style={{ fontSize: '1rem', color: '#d06060', borderBottom: '1px solid #120f08', paddingBottom: 3 }}>{w.damage}</span>,
                  <span key={`${w.name}-p`} style={{ fontSize: '1rem', color: '#88a858', borderBottom: '1px solid #120f08', paddingBottom: 3 }}>{w.price}s</span>,
                ])}
              </div>
              <div style={{ marginTop: 14 }}><SectionTitle>Armour</SectionTitle></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 44px 52px 1fr', gap: '4px 12px' }}>
                {['Armour','Abs','Price','Note'].map(h => <span key={h} style={{ fontFamily: 'Cinzel, serif', fontSize: '0.8rem', color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase' }}>{h}</span>)}
                {ARMOUR.map(a => [
                  <span key={a.name}       style={{ fontSize: '1rem', color: 'var(--text)',    borderBottom: '1px solid #120f08', paddingBottom: 3 }}>{a.name}</span>,
                  <span key={`${a.name}-a`} style={{ fontSize: '1rem', color: '#5090d8', borderBottom: '1px solid #120f08', paddingBottom: 3 }}>{a.absorption}</span>,
                  <span key={`${a.name}-p`} style={{ fontSize: '1rem', color: '#88a858', borderBottom: '1px solid #120f08', paddingBottom: 3 }}>{a.price}s</span>,
                  <span key={`${a.name}-n`} style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontStyle: 'italic', borderBottom: '1px solid #120f08', paddingBottom: 3 }}>{a.note}</span>,
                ])}
              </div>
            </div>

            <div>
              <SectionTitle>Backpack (6 Slots)</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {char.inventory.map((item, i) => (
                  <div key={i} style={{
                    border: '1px solid var(--border-dim)', padding: '6px 10px',
                    background: item?.name ? 'var(--panel-alt)' : '#090909',
                    display: 'flex', alignItems: 'center', gap: 8, minHeight: 36, borderRadius: 2,
                  }}>
                    <span style={{ fontFamily: 'Cinzel, serif', fontSize: '1rem', color: 'var(--text-muted)', minWidth: 16 }}>{i + 1}</span>
                    <input
                      type="text"
                      value={item?.name || ''}
                      onChange={e => updateInventorySlot(i, { ...item, name: e.target.value })}
                      placeholder="Empty slot…"
                      style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontFamily: 'IM Fell English, serif', fontSize: '1rem' }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 10, fontSize: '1rem', color: 'var(--text-dim)', fontStyle: 'italic', lineHeight: 1.7 }}>
                Silver, rations, bandages, lockpicks, and bait do not use backpack slots.
              </div>
            </div>
          </div>
        )}

        {/* ═══ JOURNAL ═══ */}
        {tab === 'journal' && (
          <>
            <SectionTitle>Adventure Journal</SectionTitle>
            <textarea
              rows={12}
              value={char.notes}
              onChange={e => setChar(c => ({ ...c, notes: e.target.value }))}
              placeholder={"Day 1, Morning — Set out from the Tower of the Moon…\n\nRecord your deeds, discoveries, and the whispers of the Wise…"}
              style={{
                width: '100%', background: '#0a0a0e',
                border: '1px solid var(--border)', color: 'var(--text)',
                fontFamily: 'IM Fell English, serif', fontSize: '1rem',
                padding: 12, resize: 'none', borderRadius: 2, lineHeight: 1.8,
              }}
            />
            <div style={{ marginTop: 18 }}><SectionTitle>Full Roll Log</SectionTitle></div>
            {rollLog.length === 0
              ? <div style={{ fontSize: '1rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>No rolls yet — make a skill check in the Skills tab.</div>
              : rollLog.map(r => (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '5px 10px',
                  background: 'var(--panel-alt)', border: '1px solid #120f08', fontSize: '1rem', marginBottom: 2,
                }}>
                  <span style={{ fontFamily: 'Cinzel, serif', fontSize: '1.2rem', color: r.success ? '#7ac87a' : '#e07070', minWidth: 32 }}>{r.roll}</span>
                  <span style={{ color: 'var(--text-dim)', flex: 1 }}>{r.label}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>vs {r.skill}</span>
                  <span style={{ fontSize: '1rem', color: r.critical ? '#90e890' : r.fumble ? '#e89090' : r.success ? '#7ac87a' : '#e07070' }}>
                    {r.critical ? '⭐ Critical' : r.fumble ? '💀 Fumble' : r.success ? '✓' : '✗'}
                  </span>
                </div>
              ))
            }
          </>
        )}
      </div>
    </div>
  )
}
