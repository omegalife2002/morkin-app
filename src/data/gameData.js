// ── Terrain ────────────────────────────────────────────────────────────────
export const TERRAIN = {
  plains:   { label: 'Plains',        color: '#2a3520', stroke: '#4a6035' },
  forest:   { label: 'Forest',        color: '#1a2e1a', stroke: '#2d5c2d' },
  downs:    { label: 'Downs',         color: '#2e2a18', stroke: '#5c5030' },
  mountain: { label: 'Mountains',     color: '#252525', stroke: '#4a4a4a' },
  wastes:   { label: 'Frozen Wastes', color: '#1a1e2a', stroke: '#2a3050' },
  unknown:  { label: 'Unknown',       color: '#0d0d0f', stroke: '#1a1a1f' },
}

// ── Sites ──────────────────────────────────────────────────────────────────
export const SITES = {
  none:         { label: 'None',            glyph: '',    dark: false },
  tower:        { label: 'Tower',           glyph: '🗼',   dark: false },
  citadel:      { label: 'Citadel',         glyph: '🏰',   dark: false },
  dark_citadel: { label: 'Dark Citadel',    glyph: '💀',   dark: true  },
  keep:         { label: 'Keep',            glyph: '🛡',   dark: false },
  dark_keep:    { label: 'Dark Keep',       glyph: '⚠️',   dark: true  },
  village:      { label: 'Village',         glyph: '🏘',   dark: false },
  lake:         { label: 'Lake',            glyph: '💧',   dark: false },
  henge:        { label: 'Henge',           glyph: '🪨',   dark: false },
  lith:         { label: 'Lith',            glyph: '🗿',   dark: false },
  ruin:         { label: 'Ruin',            glyph: '🏚',   dark: false },
  cavern:       { label: 'Cavern',          glyph: '🕳',   dark: false },
  snowhall:     { label: 'Snowhall',        glyph: '🏔',   dark: false },
  start:        { label: 'Tower of Moon',   glyph: '⭐',   dark: false },
  doom:         { label: 'Tower of Doom',   glyph: '🌑',   dark: true  },
}

// ── Special named sites ────────────────────────────────────────────────────
export const SPECIAL_SITES = {
  '1':  'Tower of the Moon (start)',
  '2':  'Forest of Shadows',
  '3':  'Keep of Blood',
  '4':  'Citadel of Shimeril',
  '5':  'Village of Thrall',
  '6':  'Ruin of Coroth',
  '7':  'Moonhenge',
  '8':  'Keep of Lothoril',
  '9':  'Lake Mirrow',
  '10': 'Village of Kor',
  '11': 'Citadel of Gloom',
  '12': 'Tower of Doom ⚔',
}


// ── Skill definitions ──────────────────────────────────────────────────────
export const SKILLS_DEF = [
  { id: 'animal_handling',  label: 'Animal Handling',  attr: ['CHA'],       formula: a => a.CHA },
  { id: 'athletics',        label: 'Athletics',        attr: ['DEX'],       formula: a => a.DEX },
  { id: 'camp',             label: 'Camp',             attr: ['DEX','INT'], formula: a => Math.floor(a.DEX/2 + a.INT/2) },
  { id: 'defence',          label: 'Defence',          attr: ['STR','DEX'], formula: a => Math.floor(a.STR/2 + a.DEX/2) },
  { id: 'disarm_traps',     label: 'Disarm Traps',     attr: ['DEX','INT'], formula: a => Math.floor(a.DEX/2 + a.INT/2) },
  { id: 'endurance',        label: 'Endurance',        attr: ['STR'],       formula: a => a.STR },
  { id: 'first_aid',        label: 'First Aid',        attr: ['INT'],       formula: a => a.INT },
  { id: 'fishing',          label: 'Fishing',          attr: ['DEX'],       formula: a => a.DEX },
  { id: 'foraging',         label: 'Foraging',         attr: ['DEX','INT'], formula: a => Math.floor(a.DEX/2 + a.INT/2) },
  { id: 'hunting',          label: 'Hunting',          attr: ['STR','DEX'], formula: a => Math.floor(a.STR/2 + a.DEX/2) },
  { id: 'lock_picking',     label: 'Lock-picking',     attr: ['DEX','INT'], formula: a => Math.floor(a.DEX/2 + a.INT/2) },
  { id: 'melee',            label: 'Melee',            attr: ['STR'],       formula: a => a.STR },
  { id: 'mental_toughness', label: 'Mental Toughness', attr: ['INT','CHA'], formula: a => Math.floor(a.INT/2 + a.CHA/2) },
  { id: 'might',            label: 'Might',            attr: ['STR'],       formula: a => a.STR },
  { id: 'orientation',      label: 'Orientation',      attr: ['INT'],       formula: a => a.INT },
  { id: 'perception',       label: 'Perception',       attr: ['INT'],       formula: a => a.INT },
  { id: 'persuasion',       label: 'Persuasion',       attr: ['CHA'],       formula: a => a.CHA },
  { id: 'stealth',          label: 'Stealth',          attr: ['DEX'],       formula: a => a.DEX },
]

// ── Masteries ──────────────────────────────────────────────────────────────
export const MASTERIES = [
  { id: 'weapon_master',  label: 'Weapon Master',  skillId: 'melee',           extra: '' },
  { id: 'shield_master',  label: 'Shield Master',  skillId: 'defence',         extra: '' },
  { id: 'scout',          label: 'Scout',          skillId: 'perception',      extra: '' },
  { id: 'ranger',         label: 'Ranger',         skillId: 'camp',            extra: '' },
  { id: 'locksmith',      label: 'Locksmith',      skillId: 'lock_picking',    extra: '5 lockpicks' },
  { id: 'animal_trainer', label: 'Animal Trainer', skillId: 'animal_handling', extra: '5 rations' },
  { id: 'medic',          label: 'Medic',          skillId: 'first_aid',       extra: '5 bandages' },
  { id: 'harvester',      label: 'Harvester',      skillId: 'foraging',        extra: 'Foraging Knife' },
  { id: 'hunter',         label: 'Hunter',         skillId: 'hunting',         extra: "Hunter's Sling" },
  { id: 'pathfinder',     label: 'Pathfinder',     skillId: 'orientation',     extra: '' },
  { id: 'shadowstalker',  label: 'Shadowstalker',  skillId: 'stealth',         extra: '1 Fogstone' },
]

// ── Companions ─────────────────────────────────────────────────────────────
export const COMPANIONS = [
  { id: 'shadows',  name: 'Lord of Shadows',      hp: 35, mel: 3, def: 2, dmg: 1, per: 2, bonusSkill: 'foraging',      bonusAmt: 10, rations: 6,  auto: false },
  { id: 'lothoril', name: 'Lord of Lothoril',     hp: 30, mel: 2, def: 2, dmg: 1, per: 2, bonusSkill: 'hunting',       bonusAmt: 10, rations: 6,  auto: false },
  { id: 'thrall',   name: 'Lord of Thrall',       hp: 35, mel: 2, def: 2, dmg: 1, per: 1, bonusSkill: 'camp',          bonusAmt: 10, rations: 6,  auto: false },
  { id: 'korinel',  name: 'Korinel the Fey',      hp: 24, mel: 2, def: 2, dmg: 1, per: 1, bonusSkill: 'first_aid',     bonusAmt: 10, rations: 6,  auto: false },
  { id: 'fawkrin',  name: 'Fawkrin the Skulkrin', hp: 42, mel: 1, def: 1, dmg: 1, per: 1, bonusSkill: 'disarm_traps',  bonusAmt: 10, rations: 8,  auto: true  },
  { id: 'farflame', name: 'Farflame the Dragon',  hp: 70, mel: 10,def: 5, dmg: 3, per: 5, bonusSkill: 'might',         bonusAmt: 20, rations: 0,  auto: true  },
  { id: 'blood',    name: 'Lord Blood',           hp: 40, mel: 4, def: 2, dmg: 1, per: 1, bonusSkill: 'orientation',   bonusAmt: 10, rations: 6,  auto: false },
  { id: 'dreams',   name: 'Lord of Dreams',       hp: 45, mel: 2, def: 2, dmg: 1, per: 2, bonusSkill: 'orientation',   bonusAmt: 10, rations: 6,  auto: false },
]

// ── Conditions ─────────────────────────────────────────────────────────────
export const CONDITIONS = [
  { id: 'hungry',    label: 'Hungry',    color: '#b06020', icon: '🍖', desc: '+4 Fatigue/day without food. After 6 days: quest ends.' },
  { id: 'exhausted', label: 'Exhausted', color: '#8050a0', icon: '😴', desc: 'Cannot travel. Must Rest or Camp to recover.' },
  { id: 'poisoned',  label: 'Poisoned',  color: '#40a040', icon: '☠',  desc: 'Lose 1 HP per combat turn. Cure with Venomthorn + bandage or Antidote.' },
  { id: 'bleeding',  label: 'Bleeding',  color: '#c03030', icon: '🩸', desc: 'Lose 1 HP per quarter outdoors. Cure with a bandage.' },
]

// ── Weather table ──────────────────────────────────────────────────────────
export const WEATHER_TABLE = [
  null, // index 0 unused
  'Same as yesterday (re-roll on day 1)',
  'Clear — +10 Orientation, +10 Camp',
  'Clear — +10 Orientation, +10 Camp',
  'Cloudy — No effects',
  'Windy — No effects',
  'Light Rain — No effects',
  'Rain — No effects',
  'Snow — No effects',
  'Heavy Wind — −20 all outdoor skills (Endurance check → −10)',
  'Heavy Snow — −20 all outdoor skills (Endurance check → −10)',
]

// ── Equipment quick reference ──────────────────────────────────────────────
export const WEAPONS = [
  { name: 'One-Handed Sword', damage: 'D6',   price: 10 },
  { name: 'Two-Handed Sword', damage: 'D6+1', price: 30 },
  { name: 'One-Handed Axe',   damage: 'D6',   price: 11 },
  { name: 'Two-Handed Axe',   damage: 'D6+1', price: 31 },
]

export const ARMOUR = [
  { name: 'Leather Armour',    absorption: 1, price: 10, note: '' },
  { name: 'Scale Mail',        absorption: 2, price: 70, note: '' },
  { name: 'Scale Mail Helmet', absorption: 1, price: 50, note: 'Helmet slot' },
  { name: 'Shield',            absorption: 1, price: 38, note: '1H weapons only' },
]

// ── Terrain travel reference ───────────────────────────────────────────────
export const TRAVEL_REF = {
  plains:   { walk: '2 hexes/qtr', horse: '3 hexes/qtr', fatigueWalk: 1, fatigueHorse: 0 },
  forest:   { walk: '2 hexes/qtr', horse: '3 hexes/qtr', fatigueWalk: 1, fatigueHorse: 0 },
  downs:    { walk: '2 hexes/qtr', horse: '3 hexes/qtr', fatigueWalk: 2, fatigueHorse: 1 },
  mountain: { walk: '1 hex/qtr',   horse: '2 hexes/qtr', fatigueWalk: 4, fatigueHorse: 2 },
  wastes:   { walk: 'IMPASSABLE',  horse: 'IMPASSABLE',  fatigueWalk: 0, fatigueHorse: 0 },
  unknown:  { walk: '—',           horse: '—',           fatigueWalk: 0, fatigueHorse: 0 },
}

// ── Hex map constants ──────────────────────────────────────────────────────
export const MAP_COLS     = 34
export const MAP_ROWS     = 42
export const HEX_SIZE     = 20
export const MAP_OFFSET_X = 20.0
export const MAP_OFFSET_Y = 56.6


// ── Derive computed values from character ──────────────────────────────────
export function deriveStats(char) {
  const a = char.attrs
  const mastery = MASTERIES.find(m => m.id === char.mastery)

  const skills = {}
  SKILLS_DEF.forEach(s => {
    const base        = s.formula(a)
    const distBonus   = char.skillBonuses[s.id] || 0
    const mastBonus   = mastery && mastery.skillId === s.id ? 10 : 0
    const compBonus   = char.companionSkillBonuses?.[s.id] || 0
    skills[s.id]      = Math.min(80, base + distBonus + mastBonus) + compBonus
  })

  const defenceValue = Math.floor(skills.defence / 2)
  const maxFatigue   = Math.floor(a.STR / 5)

  return { skills, defenceValue, maxFatigue }
}

// ── Default character factory ──────────────────────────────────────────────
export function makeCharacter() {
  return {
    name:         'Morkin',
    mastery:      'pathfinder',
    attrs:        { STR: 30, DEX: 40, INT: 50, CHA: 20 },
    skillBonuses: {},
    hp:           { current: 50, max: 50 },
    fatigue:      { current: 0 },
    xp:           0,
    silver:       10,
    rations:      5,
    bandages:     0,
    lockpicks:    0,
    bait:         0,
    hasHorse:     true,
    conditions:   {},
    companions:   {},      // id → boolean
    companionHp:  {},      // id → number
    inventory:    Array(6).fill(null).map(() => ({ name: '', desc: '' })),
    equippedWeapon:  '',
    equippedArmour:  '',
    equippedHelmet:  '',
    equippedCloak:   false,
    equippedAmulet:  false,
    equippedShield:  false,
    notes:           '',
  }
}

// ── Default hex grid factory ───────────────────────────────────────────────
export function makeGrid() {
  const g = {}
  for (let c = 0; c < MAP_COLS; c++) {
    for (let r = 0; r < MAP_ROWS; r++) {
      g[`${c},${r}`] = {
        terrain:     'unknown',
        site:        'none',
        explored:    false,
        playerHere:  false,
        notes:       '',
        specialSite: '',
        questedHere: false,
        soughtHere:  false,
      }
    }
  }
  // Starting position: Tower of the Moon (special site #1, col=11, row=29)
  g['16,41'] = { ...g['16,41'], terrain: 'forest', site: 'start', explored: true, playerHere: true, notes: 'Tower of the Moon — Adventure begins!', specialSite: '1' }
  return g
}
