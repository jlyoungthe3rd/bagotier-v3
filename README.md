# Bagotier V3

A browser-based game inventory management UI that mimics the feel of a modern RPG — drag-and-drop item equipping, live stat calculations, sound effects, and tooltips — built entirely client-side with React 19, TypeScript, and Vite.

**Live demo**: [jlyoungthe3rd.github.io/bagotier-v3](https://jlyoungthe3rd.github.io/bagotier-v3)

---

## What This Project Demonstrates

This project is less about the final product and more about **how** it was built: structured specification, deliberate architecture decisions, iterative feature delivery, and LLM-assisted tooling to move fast without cutting corners.

---

## Structured Planning with Speckit

Every feature in this project begins in `specs/` before a line of implementation code is written. The workflow is powered by **speckit** — a set of AI-assisted agents for VS Code Copilot that turn a natural-language feature description into a full set of design artifacts:

```
specs/
├── 001-game-inventory-system/
│   ├── spec.md          # user stories, acceptance scenarios, FRs, success criteria
│   ├── research.md      # technical alternatives considered and decisions made
│   ├── data-model.md    # entity definitions, ownership map, invariants, state transitions
│   ├── plan.md          # architecture, project structure, constitution gate checks
│   ├── quickstart.md    # run/test guide generated from the plan
│   ├── contracts/       # Zod schema contracts for every data boundary
│   └── tasks.md         # dependency-ordered, file-exact task list for implementation
├── 002-item-hover-tooltip/
└── 003-icon-only-inventory/
```

The workflow runs in phases: **specify → clarify → research → plan → tasks → implement**. Every output is grounded in a project **constitution** (`.specify/memory/constitution.md`) that enforces non-negotiable standards — testing, code quality, UX consistency, performance budgets — before implementation begins.

Every feature ships with a traceable chain from user story → acceptance scenario → task → code → test.

---

## System Design

Single-page app, no backend. All data is client-local. The design challenge was applying real architectural discipline — normalized state, explicit data ownership, formal invariants — to a frontend-only project.

### State ownership split

| Owner | Holds | Never holds |
|-------|-------|-------------|
| **React Query** | Item catalog, character, base stats | Session state |
| **Zustand** | `ItemId[]` references, mute flag, drag state | `Item` entity objects |

Components resolve IDs → full items via a `useItem(id)` selector on the React Query cache. Effective stats are always derived (`base + Σ equipped modifiers`), never stored — so they can't drift under rapid interactions.

### Formal invariants (documented before implementation)

| | |
|-|-|
| **I1** Single location | Every `ItemId` lives in exactly one place: bag cell, slot, or nowhere |
| **I2** Slot compatibility | `equipped[slot] = id` requires `catalog[id].slotType === slot` |
| **I3** Bounded bag | `bag.length === BAG_CAPACITY` always; unequip into a full bag is rejected |
| **I4** Derived stats only | Stats computed on the fly — cannot double-count modifiers |
| **I5** No entity copies | Zustand holds only IDs and primitives; enforced by a contract test |

### Other notable choices

- **Pure state transitions** — `equip`, `swap`, `unequip` are `(state, args) → state` functions defined outside the store and unit-tested without React
- **`DropOutcome` discriminated union** — one value per drag-end drives both the state transition and the sound effect; structurally impossible to fire them out of sync
- **Branded `ItemId`** — `string & { readonly [brand]: true }` catches ID misuse at compile time
- **Accessibility** — dnd-kit `KeyboardSensor` + screen-reader `Announcements`; WCAG 2.1 AA contrast via Tailwind tokens; loading/error/empty states are designed, not blank
- **Performance budgets declared upfront** — 60 fps drag, ≤ 100 ms stat update, ≤ 3 s load, ≤ 250 KB gz bundle

---

## Feature Iterations

The project has shipped three independently-scoped features, each following the full speckit workflow:

| # | Feature | What Was Delivered |
|---|---------|-------------------|
| **001** | Game Inventory System | Core drag-and-drop equipping, stat panel, sound effects, generated character, 24-cell bag |
| **002** | Item Hover Tooltip | Viewport-aware tooltip using `@floating-ui/react`, single-tooltip guarantee, rapid movement handling |
| **003** | Icon-Only Inventory | Stripped in-slot item labels; icon-only slots with accessible fallback states |

Each iteration built on the prior feature without requiring architectural changes — a direct result of the upfront data model and normalized state design.

---

## Testing Strategy

Tests are written alongside (or before) implementation. The suite has three layers:

**Contract tests** (`tests/contract/`) — Validate mock data against Zod schemas at the query boundary. Ensure the item catalog has ≥ 10 items covering all 7 slot types; assert the store's initial state has no `Item`-shaped objects.

**Unit tests** (`tests/unit/`) — Test pure functions in isolation: `equipTransition`, `swapTransition`, `unequipTransition`, `moveInBagTransition`, `computeEffectiveStats`, `useSound` idempotency.

**Integration tests** (`tests/integration/`) — React Testing Library tests covering full drag flows (equip, unequip, swap, invalid drop, rapid sequences), tooltip placement and lifecycle, sound firing exactly-once per interaction, and stat panel accuracy.

```
tests/
├── contract/    # schema + invariant validation
├── unit/        # pure logic, no React
└── integration/ # full component + interaction flows
```

---

## LLM-Assisted Development Velocity

This project uses GitHub Copilot — specifically the **speckit** agent suite — to compress the planning and scaffolding phases that typically consume a disproportionate amount of feature time.

**What the LLM did:**
- Turned a one-paragraph feature description into a complete `spec.md` (user stories, acceptance scenarios, edge cases, functional requirements, success criteria)
- Researched and documented technical trade-offs in `research.md` for each technology choice
- Generated the full data model with entity definitions, invariants, and state transition table
- Produced a constitution-checked `plan.md` with project structure and performance budgets
- Emitted a `tasks.md` with dependency-ordered, file-exact tasks ready for sequential implementation
- Implemented each task in order via `speckit.implement`, respecting all contracts defined earlier

**What this enabled:**
By the time a single implementation file was touched, the architecture was already decided, contracts were written, and tests were defined. The implementation phase became a translation exercise from well-defined tasks into code — which is exactly the kind of work that benefits most from AI assistance.

**What the LLM did not do:**
The constitution, invariants, and architectural constraints were deliberate human decisions. The LLM executes plans; it does not replace the judgment required to define them.

The net result: a project where every commit is traceable to a spec, every data boundary has a contract, every state transition has a unit test, and three features were delivered with consistent architecture — in a timeline that would be difficult to achieve without AI-augmented tooling.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Build | Vite 8 |
| Language | TypeScript 5 (strict + `noUncheckedIndexedAccess`) |
| State — session | Zustand 5 |
| State — data | TanStack React Query 5 |
| Drag and drop | @dnd-kit/core |
| Animation | Framer Motion |
| Tooltip positioning | @floating-ui/react |
| Styling | Tailwind CSS 3 |
| Validation | Zod 4 |
| Testing | Vitest + React Testing Library |
| CI/CD | GitHub Actions → GitHub Pages |

---

## Running Locally

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # full test suite
npm run lint       # ESLint + Prettier (zero errors)
npm run build      # production build with bundle size report
```
