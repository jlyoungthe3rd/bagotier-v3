# Architecture

## Core Sections (Required)

### 1) Architectural Style

- Primary style: Normalized Client-Side State Architecture with Feature-Sliced Frontend Organization.
- Why this classification: The application strictly separates session state (`Zustand`) from entity data (`TanStack React Query`). Zustand holds only primitive ID references (`ItemId`) and never duplicate entity records (enforcing invariant I5). Features are isolated in self-contained folders (`src/features/*`), while state transitions are implemented as pure, side-effect-free reducer functions.
- Primary constraints:
  - Client-Only Execution: Zero external backend services; character and item catalog data are provided via simulated asynchronous mock APIs.
  - Strict State Ownership Boundaries: React Query owns item entity definitions and base character stats; Zustand owns equipped slot mappings, the unequipped item ID set, active fan-out state, mute preferences, and navigation focus.
  - Formal Invariant Enforcement: Governed by declared invariants (I1 Single location in slot or unequipped set, I2 Slot compatibility, I3 Infallible item displacement/unequip, I4 Dynamic derived stats only, I5 No entity copies in store).

### 2) System Flow

```text
[Slot Hover (Dynamic Delay) / Focus] -> [Horizontal FanOut Render] -> [Item Select (Click / Enter)] -> [equipTransition (Zustand)] -> [Derived Stat Recalculation] -> [UI Animation & Audio]
```

1. **Inspector Trigger**: The user hovers an equipment slot (subject to dynamic 300ms/200ms delay via `slotHoverManager`) or focuses it with keyboard navigation (`src/features/character/EquipmentSlot.tsx`).
2. **Horizontal Fan-Out**: `FanOut` renders unequipped matching items along a horizontal axis (stepping left for weapon, hands, legs; right for head, body, accessory, feet), clamped to viewport edges to prevent clipping (`src/features/character/FanOut.tsx`).
3. **User Selection**: The user clicks a fanned item or presses Enter/Space on a focused fan-out option (or clicks an equipped item directly to unequip it).
4. **Pure State Transition**: Zustand applies deterministic pure transition functions (`equipTransition`, `unequipTransition`) in `src/store/useInventoryStore.ts`, updating `equipped` mappings and the `unequipped` Set without side effects.
5. **Audio Feedback**: The component invokes `useSound()`, delegating to `audioEngine.playback('equip' | 'unequip')` if unmuted (`src/features/audio/useSound.ts`).
6. **Derived Stat Recalculation**: `StatPanel` detects equipped state updates and derives effective stats via `computeEffectiveStats(baseStats, equippedItems)` on the fly, accompanied by a brief grow/color-flash animation (`src/features/character/StatPanel.tsx`, `src/features/character/stats.ts`).
7. **Animated Presentation**: Framer Motion renders slot popLayout animations and horizontal fan-out expansion/collapse (`src/features/character/EquipmentSlot.tsx`, `src/features/character/FanOut.tsx`).

### 3) Layer/Module Responsibilities

| Layer or module                                                                                               | Owns                                                                                                             | Must not own                                                      | Evidence                                                                        |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Presentation (`src/features/character/`, `src/features/inventory/`)                                           | Component rendering, horizontal fan-out interaction, local UI animations, and layout hierarchy                   | Business invariant validation and persistent state storage        | `src/features/character/CharacterView.tsx`, `src/features/character/FanOut.tsx` |
| Session State (`src/store/useInventoryStore.ts`)                                                              | Slot assignment (`equipped`), `unequipped` Set, active fan-out slot, focused fan-out index, and pure transitions | Item entity records (`Item`, `Character`) or raw audio contexts   | `src/store/useInventoryStore.ts`                                                |
| Domain Logic (`src/features/character/stats.ts`, `src/features/character/slotHoverManager.ts`, `keyboard.ts`) | Pure calculations for effective stats, slot hover warming logic, and directional slot keyboard navigation        | Direct React hook invocations or store mutations                  | `src/features/character/stats.ts`, `src/features/character/slotHoverManager.ts` |
| Data Layer (`src/features/*/use*Query.ts`, `src/mocks/`)                                                      | In-memory catalogs, mock latency simulation, and query cache entity resolution (`useItem`, `useItemsForSlot`)    | Session UI state (equipped slots, active fan-out, focus tracking) | `src/mocks/api.ts`, `src/features/inventory/useInventoryQuery.ts`               |
| Audio Subsystem (`src/features/audio/`)                                                                       | Web Audio API context management, audio buffer decoding, asset preloading, and mute gating                       | Game logic, inventory capacity checks, or UI rendering            | `src/features/audio/useSound.ts`                                                |
| Tooltip System (`src/features/inventory/tooltip/`)                                                            | Floating UI placement calculations, autoUpdate subscriptions, and portal rendering                               | Inventory state alterations or character mutations                | `src/features/inventory/tooltip/ItemTooltipPresenter.tsx`                       |

### 4) Reused Patterns

| Pattern                        | Where found                                                                                 | Why it exists                                                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Pure Transition Reducers       | `src/store/useInventoryStore.ts` (`equipTransition`, `unequipTransition`)                   | Decouples state transition logic from Zustand and React lifecycle, enabling comprehensive zero-React unit testing.                  |
| Cache Entity Selector          | `src/features/inventory/useInventoryQuery.ts` (`useItem`, `useItemsForSlot`)                | Resolves full `Item` entities from React Query cache by ID on demand, strictly preventing entity duplication in session state.      |
| Branded Primitives             | `src/types/domain.ts` (`ItemId = string & { readonly [itemIdBrand]: true }`)                | Enforces compile-time safety preventing arbitrary strings from being mistakenly passed as item IDs.                                 |
| Isolated Audio Engine Object   | `src/features/audio/useSound.ts` (`audioEngine.playback`)                                   | Separates playback invocation from the Web Audio context so tests can easily spy on or mock playback without headless audio errors. |
| Viewport-Aware Floating Portal | `src/features/inventory/tooltip/ItemTooltipPresenter.tsx` (`useFloating`, `FloatingPortal`) | Guarantees tooltips do not clip at viewport boundaries and escape parent stacking contexts.                                         |
| Directional Fan-Out Clamping   | `src/features/character/FanOut.tsx` (`computeFanPositions`, `useLayoutEffect`)              | Extends slots horizontally with direction rules (left/right) while clamping to window innerWidth to guarantee zero overflow.        |
| Slot Hover Warming Delay       | `src/features/character/slotHoverManager.ts` (`getSlotHoverDelay`)                          | Drops hover delay from 300ms to 200ms when rapidly inspecting multiple slots within 2000ms.                                         |

### 5) Known Architectural Risks

- Documentation/Codebase Divergence on Drag-and-Drop: `README.md` contains legacy text referencing `@dnd-kit/core` from the initial portfolio spec, while the application has transitioned to a Destiny 2 style interactive horizontal fan-out inspector.
- Unwrapped `act(...)` Warnings in RTL Tests: Several integration tests trigger React 19 state updates outside an explicit `act(...)` wrapper during async queries, producing harmless warning noise in Vitest logs.
- Formatting & Test Suite Stability: All 127 tests pass across 30 test files, and `npm run lint` passes with 0 warnings and full Prettier compliance.

### 6) Evidence

- `src/App.tsx`
- `src/store/useInventoryStore.ts`
- `src/features/character/stats.ts`
- `src/features/inventory/useInventoryQuery.ts`
- `src/features/inventory/tooltip/ItemTooltipPresenter.tsx`
- `src/types/domain.ts`
- `src/types/schemas.ts`
