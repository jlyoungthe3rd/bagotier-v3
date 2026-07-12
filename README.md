# Bagotier V3

A browser-based game inventory management UI that mimics the feel of a modern RPG — drag-and-drop item equipping, live stat calculations, sound effects, and tooltips — built entirely client-side with React 19, TypeScript, and Vite.

**Live demo**: [jlyoungthe3rd.github.io/bagotier-v3](https://jlyoungthe3rd.github.io/bagotier-v3)

---

## What This Project Demonstrates

This project is less about the final product and more about **how** it was built: structured specification, deliberate architecture decisions, iterative feature delivery, and LLM-assisted tooling to move fast without cutting corners.

---

## Structured Planning with Speckit

Every feature in this project begins in `specs/` before a line of implementation code is written. The workflow is powered by **[speckit](https://github.com/speckit)** — a set of AI-assisted agents for VS Code Copilot that turn a natural-language feature description into a full set of design artifacts:

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

The workflow runs in phases: **specify → clarify → research → plan → tasks → implement**. The AI agents handle the heavy lifting of drafting each artifact, but every output is grounded in a project **constitution** (`.specify/memory/constitution.md`) that enforces non-negotiable standards — testing, code quality, UX consistency, performance budgets — before implementation begins.

This means every feature ships with a traceable chain from user story to acceptance scenario to task to code to test.

---

## System Design

### Architecture at a Glance

This is a single-page application with **no backend**. All data is client-local. The interesting design challenge was applying real architectural discipline — normalized state, explicit data ownership, strict contracts — to a frontend-only project.

```
┌─────────────────────────────────────────────┐
│                  React App                  │
│                                             │
│  ┌──────────────┐     ┌───────────────────┐ │
│  │  React Query │     │      Zustand      │ │
│  │  (data layer)│     │  (session state)  │ │
│  │              │     │                   │ │
│  │ Item catalog │◄────│ equipped: ItemId[]│ │
│  │ Character    │     │ bag: ItemId[]     │ │
│  │ Base stats   │     │ muted: boolean    │ │
│  └──────────────┘     │ activeDrag: ...   │ │
│         │             └───────────────────┘ │
│         └──────────────────────┐            │
│                   Derived      ▼            │
│              effectiveStats = base + Σmod   │
└─────────────────────────────────────────────┘
```

### Key Technical Choices

#### Normalized State: React Query + Zustand, Never Both

The most deliberate design decision in the project. **React Query owns all entity data** (item catalog, character base stats). **Zustand owns only session state**, and that state contains exclusively `ItemId` strings — never `Item` objects.

Components resolve IDs to full item data through a `useItem(id)` selector hook that reads the React Query cache. Zustand never stores an entity copy.

```typescript
// Zustand state — IDs only, never entity copies (invariant I5)
export interface EquipmentState {
  readonly equipped: Readonly<Record<SlotType, ItemId | null>>;
  readonly bag: readonly (ItemId | null)[];
  readonly muted: boolean;
  readonly activeDrag: { itemId: ItemId; origin: DragOrigin } | null;
}
```

**Why this matters**: It establishes a single source of truth. Effective stats can never drift from item data because stats are computed on the fly from the canonical catalog — they are never stored. Rapid equip/unequip sequences cannot produce double-counted modifiers (a real race condition in simpler designs) because each stat is derived fresh from the current set of equipped IDs.

#### Pure State Transitions

All Zustand mutations are expressed as pure `(state, args) → state` functions, defined outside the store and unit-tested directly without React:

```typescript
export function equipTransition(state, itemId, slot): EquipmentState { ... }
export function swapTransition(state, itemId, slot): EquipmentState { ... }
export function unequipTransition(state, slot, toBagIndex?): { state, result } { ... }
```

This made the business logic straightforward to test exhaustively and keeps the store thin.

#### Formal Invariants

The data model documents five explicit invariants that every transition must preserve:

| Invariant | Description |
|-----------|-------------|
| **I1** — Single location | Every `ItemId` exists in exactly one place: a bag cell, a slot, or nowhere. Never duplicated. |
| **I2** — Slot compatibility | `equipped[slot] = id` implies `catalog[id].slotType === slot`. No mismatched items. |
| **I3** — Bounded bag | `bag.length === BAG_CAPACITY` always. Unequip into a full bag is rejected with user feedback. |
| **I4** — Derived stats only | Effective stats are computed, never stored. Cannot drift under rapid interactions. |
| **I5** — No entity copies in store | Zustand holds only IDs and primitives. Enforced by a contract test. |

#### Drag and Drop: Exactly-Once Sound + State

A single `DropOutcome` discriminated union is resolved per drag-end event. This single value drives both the state transition and the sound effect, making it structurally impossible to fire a sound without updating state (or vice versa):

```typescript
type DropOutcome =
  | { type: 'equip'; itemId; slot }         // → equip sound
  | { type: 'swap'; itemId; slot; replacedItemId } // → equip sound
  | { type: 'unequip'; slot; toBagIndex? }  // → unequip sound
  | { type: 'moveInBag'; itemId; toBagIndex } // → no sound
  | { type: 'invalid' }                     // → invalid sound
  | { type: 'cancelled' };                  // → invalid sound
```

#### Typed Domain with Branded IDs

`ItemId` is a branded string type, making it impossible to pass an arbitrary string where an item identifier is expected:

```typescript
declare const itemIdBrand: unique symbol;
export type ItemId = string & { readonly [itemIdBrand]: true };
```

All slot types and stat keys are `as const` tuple unions, meaning TypeScript enforces exhaustive handling at every switch.

#### Accessible by Design

- dnd-kit's `KeyboardSensor` + screen-reader `Announcements` provide full keyboard and assistive tech support for drag operations
- All interactive elements have accessible names and meet WCAG 2.1 AA contrast ratios via Tailwind design tokens
- Loading, error, and empty states are designed first-class (no blank screens)

#### Performance Budgets (declared up front)

| Budget | Target |
|--------|--------|
| Drag frame rate | 60 fps (transform-based, no layout thrash) |
| Stat panel update after drop | ≤ 100 ms perceived |
| Initial load | ≤ 3 s on mid-tier hardware |
| JS bundle | ≤ 250 KB gzipped |

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
