# Implementation Plan: Game Inventory Management Experience

**Branch**: `001-game-inventory-system` | **Date**: 2026-07-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-game-inventory-system/spec.md`

## Summary

Build a standalone, client-only web application that mimics a modern videogame inventory screen: a generated character with seven equipment slots (head, body, legs, hands, feet, weapon, accessory), a stat panel (HP, MP, DEF, STR, …), and an inventory grid. Users drag items between the grid and slots with dnd-kit; equipping/unequipping updates effective stats immediately and plays distinct sound effects (with a mute toggle). Item and player data are mocked locally and served through React Query; Zustand holds only session UI/equipment state that *references* React Query data by ID (never copies entities). Framer Motion animates menus and equip/unequip transitions; Tailwind CSS provides all styling. Built with Vite and strict TypeScript, no backend.

## Technical Context

**Language/Version**: TypeScript 5.x with `"strict": true` (plus `noUncheckedIndexedAccess`), ES2022 target

**Primary Dependencies**: React 18, Vite 5, Zustand (global session state), @tanstack/react-query (data retrieval from local mocks), @dnd-kit/core (+ @dnd-kit/utilities) for drag-and-drop, Framer Motion (menu + equip/unequip animations), Tailwind CSS (all styling)

**Storage**: N/A — no backend; item catalog and player base data are local static mock modules exposed via async fetchers consumed by React Query. No session persistence (per spec assumption).

**Testing**: Vitest + React Testing Library for unit/component tests; @testing-library/user-event and dnd-kit test utilities for interaction tests; contract tests validate mock data against Zod schemas

**Target Platform**: Modern evergreen browsers (Chrome/Firefox/Safari/Edge), desktop-first with pointer input; touch supported via dnd-kit sensors

**Project Type**: Single-page web application (frontend only)

**Performance Goals**: 60 fps drag tracking; stat panel update ≤ 100 ms after drop (perceived instantaneous, SC-002/SC-003); initial load ≤ 3 s on mid-tier hardware; JS bundle ≤ 250 KB gzipped

**Constraints**: No backend/network; Zustand must never duplicate React Query entity data — it stores IDs and derives entities via selectors/hooks; sound playback must be idempotent per interaction (no double-fires, FR-011/SC-004); audio must degrade gracefully before first user gesture (autoplay policy)

**Scale/Scope**: Single user, single character, 1 screen, 7 slot types, ≥ 10 seed items, 4+ stats, 4 sound effects

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.* (Constitution v1.0.0)

| Gate | Principle | Assessment | Status |
|------|-----------|------------|--------|
| CQ-1 | I. Code Quality — lint/format zero-error, single-responsibility modules | ESLint (typescript-eslint strict) + Prettier configured in Phase 1 quickstart; feature split into `features/inventory`, `features/character`, `features/audio` modules with single responsibilities; strict TS enforces API documentation via types + TSDoc on exported functions | ✅ PASS |
| TS-1 | II. Testing Standards — tests before/alongside, unit + contract coverage | Vitest suite planned per module: pure stat-computation and equip/unequip reducer logic unit-tested first (red-green); contract tests validate mock data + store/query boundary (Zod schemas in `contracts/`); interaction tests for drag flows; suite runs in CI/`npm test` gate | ✅ PASS |
| UX-1 | III. UX Consistency — shared design system, states, accessibility | Tailwind design tokens (theme extension) define the single design system; loading/empty/error states designed for the React Query fetch (skeleton + retry); dnd-kit provides keyboard sensor + screen-reader announcements for drag operations; WCAG AA contrast tokens; consistent terminology from spec entities | ✅ PASS |
| PR-1 | IV. Performance Requirements — explicit budgets, bounded resources | Budgets declared above (60 fps drag, ≤100 ms stat update, ≤3 s load, ≤250 KB gz bundle); dnd-kit uses transform-based dragging (no layout thrash); Zustand selectors prevent over-render; bundle checked via `vite build` size report; measurement noted in quickstart | ✅ PASS |
| SG-1 | Simplicity default (YAGNI) | Five dependencies, each mandated by user's technical context and mapped to a spec requirement (dnd → FR-002/003, motion → UX polish for equip/unequip, query → data retrieval, zustand → session state, tailwind → styling). No extra layers, no backend, no router | ✅ PASS |

**Initial Constitution Check: PASS — no violations; Complexity Tracking not required.**

**Post-Design Constitution Check (after Phase 1): PASS** — design artifacts introduce no new dependencies or layers; contracts (Zod schemas) strengthen TS-1; data model keeps Zustand normalized to IDs, upholding CQ-1 (single source of truth) and PR-1 (minimal re-renders). One observability note: constitution's "production metrics" bullet is scoped to a `console`-based dev logger utility for interaction timing, justified by the app having no backend/telemetry target (recorded below in Complexity Tracking as a scoped interpretation, not a violation).

## Project Structure

### Documentation (this feature)

```text
specs/001-game-inventory-system/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── item-schema.md       # Item + ItemCatalog contract (Zod)
│   ├── character-schema.md  # Character/base-stats contract (Zod)
│   └── store-contracts.md   # Zustand store + query-key contracts
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── main.tsx                     # Vite entry; QueryClientProvider setup
├── App.tsx                      # Screen layout composition
├── index.css                    # Tailwind entry + design tokens
├── lib/
│   ├── queryClient.ts           # React Query client config
│   └── queryKeys.ts             # Centralized query key factory
├── mocks/
│   ├── items.ts                 # ≥10 seed items (typed, schema-validated)
│   ├── character.ts             # Generated character + base stats
│   └── api.ts                   # Async mock fetchers (simulated latency)
├── features/
│   ├── inventory/
│   │   ├── InventoryGrid.tsx    # Droppable grid of cells
│   │   ├── InventoryItem.tsx    # Draggable item tile
│   │   ├── useInventoryQuery.ts # React Query hook for item catalog
│   │   └── dnd.ts               # DndContext handlers: equip/unequip/swap/cancel
│   ├── character/
│   │   ├── CharacterView.tsx    # Generated character centerpiece
│   │   ├── EquipmentSlot.tsx    # Droppable slot with highlight states
│   │   ├── StatPanel.tsx        # Effective stats + delta highlight (Framer Motion)
│   │   ├── useCharacterQuery.ts # React Query hook for character data
│   │   └── stats.ts             # Pure effective-stat computation (unit-tested)
│   └── audio/
│       ├── sounds.ts            # Sound registry: pickup/equip/unequip/invalid
│       ├── useSound.ts          # Idempotent playback hook, honors mute
│       └── MuteToggle.tsx       # Accessible mute control
├── store/
│   └── useInventoryStore.ts     # Zustand: equipped IDs, bag IDs, mute, drag state
└── types/
    └── domain.ts                # Item, SlotType, Stats, Character types (from contracts)

tests/
├── contract/                    # Zod schema validation of mocks + store shape
├── integration/                 # Drag-equip/unequip/swap flows, sound-once, rapid ops
└── unit/                        # stats.ts, store actions/reducers, useSound
```

**Structure Decision**: Single frontend project (Option 1 adapted for a Vite SPA). Feature-folder organization (`features/inventory`, `features/character`, `features/audio`) keeps each module single-responsibility per Constitution I; `store/` and `mocks/` are cross-cutting and intentionally thin. No backend directory exists because the spec and user context forbid one.

## Complexity Tracking

No constitution violations to justify. One recorded scoped interpretation:

| Item | Why Needed | Simpler Alternative Rejected Because |
|------|------------|--------------------------------------|
| Observability (Principle IV) scoped to dev-mode console timing logger instead of production metrics pipeline | App is client-only with no backend or telemetry endpoint; spec forbids server-side components | A full metrics/logging stack would add a dependency and network egress for a mock-data demo app, violating the simplicity default |
