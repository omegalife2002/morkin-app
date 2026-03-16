# Morkin — The Lords of Midnight Companion App

A browser-based companion app for **Morkin: The Lords of Midnight** solo RPG by Juan Díaz-Bustamante.

## Features

- **Hex Map Tracker** — 18×14 SVG hex grid with fog of war, terrain, sites, notes, and player position
- **Character Sheet** — Full interactive sheet: attributes, skills (with D100 roll buttons), companions with HP tracking, gear/inventory, and adventure journal
- **Turn Tracker** — Day/quarter/ice fear/weather strip always visible
- **Auto-save** — All state persists to localStorage automatically
- **Export / Import** — Save and load JSON snapshots of your game

## Running Locally

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

## Deploying to Netlify

**Option A — Drag & drop:**
```bash
npm run build
# Drag the dist/ folder to netlify.com/drop
```

**Option B — Git integration:**
1. Push this repo to GitHub
2. Connect it in Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`

## Project Structure

```
src/
├── App.jsx                  # Top-level shell and navigation
├── index.css                # CSS variables, reset, animations
├── main.jsx                 # React entry point
├── data/
│   └── gameData.js          # All rules data: terrain, sites, skills, companions, etc.
├── hooks/
│   └── useGameState.js      # All state management + localStorage persistence
└── components/
    ├── UI.jsx               # Shared primitives: StatBar, Counter, TabBar, etc.
    ├── TurnTracker.jsx      # Day / quarter / ice fear / weather strip
    ├── HexMap.jsx           # SVG hex map + hex editor panel
    └── CharacterSheet.jsx   # Full character management (5 tabs)
```

## Roadmap Ideas

- Encounters / events roller (roll on terrain-specific tables)
- Combat tracker (action points, enemy HP)
- Ruin & cavern mapper
- Bestiary reference
- Quest log

## Credits

Game designed by Juan Díaz-Bustamante, based on *The Lords of Midnight* by Mike Singleton.
