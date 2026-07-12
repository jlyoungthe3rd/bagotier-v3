# Quickstart: Game Inventory Management Experience

**Feature**: `001-game-inventory-system` | Validation & run guide (no implementation code here)

## Prerequisites

- Node.js ≥ 20, npm ≥ 10
- A modern browser (Chrome/Firefox/Safari/Edge)

## Setup

```bash
# from repo root — scaffold (first time only)
npm create vite@latest . -- --template react-ts
npm install zustand @tanstack/react-query @dnd-kit/core @dnd-kit/utilities framer-motion zod
npm install -D tailwindcss postcss autoprefixer vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom eslint prettier
npx tailwindcss init -p
```

Verify strict TypeScript: `tsconfig.json` must include `"strict": true` and
`"noUncheckedIndexedAccess": true`.

## Run

```bash
npm run dev        # Vite dev server → http://localhost:5173
npm run build      # production build; check bundle size report (budget: ≤250 KB gz)
npm run preview    # serve production build
```

## Test

```bash
npm test               # full Vitest suite (unit + contract + integration) — merge gate
npm run test -- tests/contract     # contract tests only (schemas in specs/001-game-inventory-system/contracts/)
npm run lint           # ESLint + Prettier — zero errors required (Constitution I)
```

## Validation scenarios

Each scenario maps to spec acceptance criteria; all must pass before the feature is done.

### V1 — Equip via drag and drop (US1 / FR-002, FR-003, FR-005)

1. `npm run dev`, open the app. Expect: character with 7 labeled slots, stat panel, and
   an inventory grid with ≥ 10 items (loading skeletons appear briefly first).
2. Drag a head item over the head slot → slot highlights as valid; release → item equips,
   disappears from grid.
3. Drag a head item over the legs slot → invalid indication; release → item returns to
   its original cell and the invalid sound plays.
4. Release a dragged item over empty space → item returns to origin (FR-012).

### V2 — Stats update (US2 / FR-006, FR-014)

1. Note base DEF in the stat panel. Equip a helmet with +5 DEF → panel shows base+5
   immediately (≤100 ms perceived) with a delta highlight animation.
2. Unequip → value reverts to base. Equip several items → each stat = base + sum of
   equipped modifiers (cross-check against `data-model.md` formula, clamped at 0).

### V3 — Unequip & swap (US3 / FR-007, FR-008)

1. Drag an equipped helmet from the head slot to the grid → slot empties, item returns.
2. With a helmet equipped, drag a second head item onto the head slot → items swap; the
   displaced item lands in the incoming item's cell.
3. Fill the bag, attempt an unequip → action blocked with a visible explanation.

### V4 — Sounds & mute (US4 / FR-009, FR-010, SC-004)

1. With audio on: pickup, valid-equip, unequip, and invalid-drop each play their distinct
   sound exactly once. (Automated: sound-spy integration tests.)
2. Toggle the mute control → repeat all interactions → zero sounds.
3. Fresh page load, interact immediately → app works; audio starts on first permitted
   gesture (no console errors from autoplay policy).

### V5 — Consistency under rapid interaction (SC-006, FR-011)

- Automated: integration test performs 20 rapid equip/swap/unequip operations and asserts
  stats, bag, and slots match the pure-model expectation (see
  [contracts/store-contracts.md](./contracts/store-contracts.md) invariant tests).

### V6 — Accessibility & UX states (Constitution III)

1. Tab to an inventory item, activate the keyboard sensor (Space/Enter), move with
   arrows, drop on a slot → equip works keyboard-only; screen-reader announcements fire.
2. Simulate fetch failure (throw in mock fetcher) → designed error state with retry
   renders, not a blank screen.
3. Verify token contrast: slot-state and stat-delta colors meet WCAG 2.1 AA.

### V7 — Performance budgets (Constitution IV)

1. `npm run build` → confirm gzipped JS ≤ 250 KB from Vite's output.
2. In Chrome DevTools Performance panel, record a drag across the screen → no dropped
   frames (60 fps), no layout thrash (drag uses transforms only).
3. Dev-mode interaction logger reports stat-panel update ≤ 100 ms after drop.

## References

- Data shapes & invariants: [data-model.md](./data-model.md)
- Boundary schemas: [contracts/](./contracts/)
- Decisions & rationale: [research.md](./research.md)
