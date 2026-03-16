import { useState, useCallback, useEffect, useRef } from 'react'
import { makeCharacter, makeGrid } from '../data/gameData'

const STORAGE_KEY = 'morkin-save-v1'

function loadSave() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function createInitialState() {
  const saved = loadSave()
  return {
    char:    saved?.char    ?? makeCharacter(),
    grid:    saved?.grid    ?? makeGrid(),
    day:     saved?.day     ?? 1,
    quarter: saved?.quarter ?? 1,
    iceFear: saved?.iceFear ?? 1,
    weather: saved?.weather ?? null,
    rollLog: saved?.rollLog ?? [],
  }
}

export function useGameState() {
  const [state, setState] = useState(createInitialState)
  const saveTimer = useRef(null)

  // ── Auto-save with debounce ──────────────────────────────────────────────
  useEffect(() => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch { /* storage full or unavailable */ }
    }, 500)
    return () => clearTimeout(saveTimer.current)
  }, [state])

  // ── Character updaters ───────────────────────────────────────────────────
  const setChar = useCallback((updater) => {
    setState(s => ({
      ...s,
      char: typeof updater === 'function' ? updater(s.char) : { ...s.char, ...updater },
    }))
  }, [])

  const setAttr = useCallback((attr, val) => {
    setChar(c => ({ ...c, attrs: { ...c.attrs, [attr]: Math.max(10, Math.min(80, val)) } }))
  }, [setChar])

  const adjustHp = useCallback((delta, absolute) => {
    setChar(c => ({
      ...c,
      hp: {
        ...c.hp,
        current: absolute !== undefined
          ? Math.max(0, Math.min(c.hp.max, absolute))
          : Math.max(0, Math.min(c.hp.max, c.hp.current + delta)),
      },
    }))
  }, [setChar])

  const adjustFatigue = useCallback((delta, absolute) => {
    setChar(c => {
      const max = Math.floor(c.attrs.STR / 5)
      const next = absolute !== undefined
        ? Math.max(0, Math.min(max + 5, absolute))
        : Math.max(0, c.fatigue.current + delta)
      const conditions = { ...c.conditions, exhausted: next >= max }
      return { ...c, fatigue: { current: next }, conditions }
    })
  }, [setChar])

  const setSkillBonus = useCallback((id, val) => {
    setChar(c => ({ ...c, skillBonuses: { ...c.skillBonuses, [id]: Number(val) } }))
  }, [setChar])

  const toggleCondition = useCallback((id) => {
    setChar(c => ({ ...c, conditions: { ...c.conditions, [id]: !c.conditions[id] } }))
  }, [setChar])

  const toggleCompanion = useCallback((comp) => {
    setChar(c => {
      const joining = !c.companions[comp.id]
      return {
        ...c,
        companions:  { ...c.companions,  [comp.id]: joining },
        companionHp: { ...c.companionHp, [comp.id]: joining ? comp.hp : (c.companionHp[comp.id] ?? comp.hp) },
      }
    })
  }, [setChar])

  const adjustCompanionHp = useCallback((id, delta, maxHp) => {
    setChar(c => ({
      ...c,
      companionHp: {
        ...c.companionHp,
        [id]: Math.max(0, Math.min(maxHp, (c.companionHp[id] ?? maxHp) + delta)),
      },
    }))
  }, [setChar])

  const updateInventorySlot = useCallback((idx, item) => {
    setChar(c => {
      const inventory = [...c.inventory]
      inventory[idx] = item
      return { ...c, inventory }
    })
  }, [setChar])

  // ── Grid updaters ────────────────────────────────────────────────────────
  const updateHex = useCallback((key, updates) => {
    setState(s => ({
      ...s,
      grid: { ...s.grid, [key]: { ...s.grid[key], ...updates } },
    }))
  }, [])

  const movePlayer = useCallback((key) => {
    setState(s => {
      const next = { ...s.grid }
      Object.keys(next).forEach(k => {
        if (next[k].playerHere) next[k] = { ...next[k], playerHere: false }
      })
      next[key] = { ...next[key], playerHere: true, explored: true }
      return { ...s, grid: next }
    })
  }, [])

  // ── Turn management ──────────────────────────────────────────────────────
  const advanceQuarter = useCallback(() => {
    setState(s => {
      if (s.quarter < 4) {
        return { ...s, quarter: s.quarter + 1 }
      }
      const newDay = s.day + 1
      const newIceFear = newDay > 20 ? 3 : newDay > 10 ? 2 : 1
      return { ...s, quarter: 1, day: newDay, iceFear: newIceFear, weather: null }
    })
  }, [])

  const rollWeather = useCallback(() => {
    setState(s => {
      let roll = Math.floor(Math.random() * 10) + 1
      if (roll === 1 && s.day === 1) roll = Math.floor(Math.random() * 9) + 2
      return { ...s, weather: { roll, day: s.day } }
    })
  }, [])

  const setDay = useCallback((d) => {
    setState(s => {
      const day = Math.max(1, Math.min(30, d))
      const iceFear = day > 20 ? 3 : day > 10 ? 2 : 1
      return { ...s, day, iceFear, weather: null }
    })
  }, [])

  const setQuarter = useCallback((q) => {
    setState(s => ({ ...s, quarter: Math.max(1, Math.min(4, q)) }))
  }, [])

  const setIceFear = useCallback((n) => {
    setState(s => ({ ...s, iceFear: Math.max(1, Math.min(3, n)) }))
  }, [])

  // ── Dice / roll log ──────────────────────────────────────────────────────
  const addRollLog = useCallback((entry) => {
    setState(s => ({
      ...s,
      rollLog: [{ ...entry, id: Date.now() }, ...s.rollLog.slice(0, 49)],
    }))
  }, [])

  // ── Save management ──────────────────────────────────────────────────────
  const resetAll = useCallback(() => {
    if (confirm('Reset all game data? This cannot be undone.')) {
      localStorage.removeItem(STORAGE_KEY)
      setState({
        char:    makeCharacter(),
        grid:    makeGrid(),
        day:     1,
        quarter: 1,
        iceFear: 1,
        weather: null,
        rollLog: [],
      })
    }
  }, [])

  const exportSave = useCallback(() => {
    const data = JSON.stringify(state, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `morkin-save-day${state.day}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [state])

  const importSave = useCallback((file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        setState(data)
      } catch {
        alert('Invalid save file.')
      }
    }
    reader.readAsText(file)
  }, [])

  return {
    // State
    char:    state.char,
    grid:    state.grid,
    day:     state.day,
    quarter: state.quarter,
    iceFear: state.iceFear,
    weather: state.weather,
    rollLog: state.rollLog,

    // Character actions
    setChar,
    setAttr,
    adjustHp,
    adjustFatigue,
    setSkillBonus,
    toggleCondition,
    toggleCompanion,
    adjustCompanionHp,
    updateInventorySlot,

    // Map actions
    updateHex,
    movePlayer,

    // Turn actions
    advanceQuarter,
    rollWeather,
    setDay,
    setQuarter,
    setIceFear,

    // Dice
    addRollLog,

    // Save/load
    resetAll,
    exportSave,
    importSave,
  }
}
