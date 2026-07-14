# Bagotier V3

A browser-based game inventory management UI built entirely client-side with **React 19**, **TypeScript** (strict), and **Vite** — drag-and-drop item equipping, live stat calculations, sound effects, and viewport-aware tooltips.

**Live demo**: [jlyoungthe3rd.github.io/bagotier-v3](https://jlyoungthe3rd.github.io/bagotier-v3)

---

## Why This Exists

This project is an engineering portfolio piece. The domain (RPG inventory) is intentionally approachable so that the focus stays on _how_ the frontend was built: normalized state, formal invariants, a typed component contract layer, and a three-layer test suite — all spec'd and reviewed before the first implementation file was touched.

### Frontend Engineering Signals at a Glance

| Area                 | What's Here                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| **React**            | React 19 with hooks, custom selectors, and suspense-compatible async state                         |
| **TypeScript**       | Strict mode + `noUncheckedIndexedAccess`; branded types; discriminated unions as control flow      |
| **State management** | Zustand (session/UI) + React Query (data); explicit ownership boundaries and no entity duplication |
| **Component design** | Pure state transitions decoupled from components; single-responsibility droppable/draggable split  |
| **Testing**          | Contract → Unit → Integration pyramid; tests defined before implementation                         |
| **Accessibility**    | dnd-kit `KeyboardSensor`, screen-reader `Announcements`, WCAG 2.1 AA contrast                      |
| **Performance**      | 60 fps drag, ≤ 100 ms stat update, ≤ 250 KB gz bundle — declared as acceptance criteria upfront    |
| **Tooling**          | Vite, ESLint (zero warnings), Prettier, GitHub Actions → GitHub Pages                              |

---

## Stack

| Layer               | Technology                                         |
| ------------------- | -------------------------------------------------- |
| Framework           | React 19                                           |
| Build               | Vite 8                                             |
| Language            | TypeScript 5 (strict + `noUncheckedIndexedAccess`) |
| State — session     | Zustand 5                                          |
| State — data        | TanStack React Query 5                             |
| Drag and drop       | @dnd-kit/core                                      |
| Animation           | Framer Motion                                      |
| Tooltip positioning | @floating-ui/react                                 |
| Styling             | Tailwind CSS 3                                     |
| Validation          | Zod 4                                              |
| Testing             | Vitest + React Testing Library                     |
| CI/CD               | GitHub Actions → GitHub Pages                      |

---

## System Design

Single-page app, no backend. All data is client-local. The design challenge was applying real architectural discipline — normalized state, explicit data ownership, formal invariants — to a frontend-only project.

### State ownership split

| Owner           | Holds                                        | Never holds           |
| --------------- | -------------------------------------------- | --------------------- |
| **React Query** | Item catalog, character, base stats          | Session state         |
| **Zustand**     | `ItemId[]` references, mute flag, drag state | `Item` entity objects |

Components resolve IDs → full items via a `useItem(id)` selector on the React Query cache. Effective stats are always derived (`base + Σ equipped modifiers`), never stored — so they can't drift under rapid interactions.

### Formal invariants (documented before implementation)

|                           |                                                                           |
| ------------------------- | ------------------------------------------------------------------------- |
| **I1** Single location    | Every `ItemId` lives in exactly one place: bag cell, slot, or nowhere     |
| **I2** Slot compatibility | `equipped[slot] = id` requires `catalog[id].slotType === slot`            |
| **I3** Bounded bag        | `bag.length === BAG_CAPACITY` always; unequip into a full bag is rejected |
| **I4** Derived stats only | Stats computed on the fly — cannot double-count modifiers                 |
| **I5** No entity copies   | Zustand holds only IDs and primitives; enforced by a contract test        |

### Notable implementation choices

- **Pure state transitions** — `equip`, `swap`, `unequip` are `(state, args) → state` functions defined outside the store and unit-tested without React
- **`DropOutcome` discriminated union** — one value per drag-end drives both the state transition and the sound effect; structurally impossible to fire them out of sync
- **Branded `ItemId`** — `string & { readonly [brand]: true }` catches ID misuse at compile time
- **Accessibility** — dnd-kit `KeyboardSensor` + screen-reader `Announcements`; WCAG 2.1 AA contrast via Tailwind tokens; loading/error/empty states are designed, not blank
- **Performance budgets declared upfront** — 60 fps drag, ≤ 100 ms stat update, ≤ 3 s load, ≤ 250 KB gz bundle

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

## Feature Iterations

Three independently-scoped features, each following the same spec-first workflow:

| #       | Feature               | What Was Delivered                                                                                   |
| ------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| **001** | Game Inventory System | Core drag-and-drop equipping, stat panel, sound effects, generated character, 24-cell bag            |
| **002** | Item Hover Tooltip    | Viewport-aware tooltip using `@floating-ui/react`, single-tooltip guarantee, rapid movement handling |
| **003** | Icon-Only Inventory   | Stripped in-slot item labels; icon-only slots with accessible fallback states                        |

Each iteration built on the prior feature without requiring architectural changes — a direct result of the upfront data model and normalized state design.

---

## Specifications & Testing

Before any implementation code was written, the features were spec'd out with clear user stories and functional requirements. For historical reference, the consolidated specifications for all features are maintained in [specifications.md](file:///Users/jlyoungthe3rd/Workspace/bagotierV3/docs/specifications.md).

This focused documentation approach keeps the repository clean and ensures that:

1. The **specifications** drive the acceptance criteria and test cases.
2. The **types** and **Zod schemas** act as code-enforced contracts.
3. The **test suite** acts as the automated specification validator.

---

## Running Locally

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # full test suite
npm run lint       # ESLint + Prettier (zero errors)
npm run build      # production build with bundle size report
```
