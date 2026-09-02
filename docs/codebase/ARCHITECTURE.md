# Architecture

## Core Sections (Required)

### 1) Architectural Style

- Primary style: Normalized Client-Side State Architecture with Feature-Sliced Frontend Organization.
- Why this classification: The application strictly separates session state (`Zustand`) from entity data (`TanStack React Query`). Zustand holds only primitive ID references (`ItemId`) and never duplicate entity records (enforcing invariant I5). Features are isolated in self-contained folders (`src/features/*`), while state transitions are implemented as pure, side-effect-free reducer functions.
- Primary constraints:
  - Client-Only Execution: Zero external backend services; character and item catalog data are provided via simulated asynchronous mock APIs.
  - Strict State Ownership Boundaries: React Query owns item entity definitions and base character stats; Zustand owns bag cell positioning, equipped slot mappings, mute preferences, and navigation focus.
  - Formal Invariant Enforcement: Governed by five declared invariants (I1 Single location, I2 Slot compatibility, I3 Bounded bag capacity of 24, I4 Dynamic derived stats only, I5 No entity copies in store).

### 2) System Flow

```text
[User Action (Click / KeyDown)] -> [Feature Handler] -> [Pure Transition (Zustand)] -> [Derived Stat Computation] -> [UI / Audio / Tooltip Update]
```

1. **User Action**: The user clicks an inventory item or presses Enter/Space on a focused slot (`src/features/inventory/InventoryItem.tsx`).
2. **Action Dispatch**: The component's `handleClick` determines whether the item is situated in the bag or an equipment slot and calls `store.equip()`, `store.swap()`, or `store.unequip()` (`src/features/inventory/InventoryItem.tsx`).
3. **Pure State Transition**: Zustand applies deterministic pure transition functions (`equipTransition`, `swapTransition`, `unequipTransition`) in `src/store/useInventoryStore.ts`, updating ID arrays without side effects.
4. **Audio Feedback**: The component invokes `useSound()`, delegating to `audioEngine.playback('equip' | 'unequip' | 'invalid')` if unmuted (`src/features/audio/useSound.ts`).
5. **Derived Stat Recalculation**: `StatPanel` detects equipped state updates and derives effective stats via `computeEffectiveStats(baseStats, equippedItems)` on the fly, avoiding persisted stat drift (`src/features/character/StatPanel.tsx`, `src/features/character/stats.ts`).
6. **Animated Presentation**: Framer Motion renders slot mounting animations and color-coded attribute change highlights (`src/features/character/EquipmentSlot.tsx`, `src/features/character/StatPanel.tsx`).

### 3) Layer/Module Responsibilities

| Layer or module                                                                        | Owns                                                                                                        | Must not own                                                     | Evidence                                                                               |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Presentation (`src/features/`)                                                         | Component rendering, event listeners, local UI animations, and layout hierarchy                             | Business invariant validation and persistent state storage       | `src/features/character/CharacterView.tsx`, `src/features/inventory/InventoryGrid.tsx` |
| Session State (`src/store/useInventoryStore.ts`)                                       | Slot assignment (`equipped`), bag array, active focus section/index, feedback banners, and pure transitions | Item entity records (`Item`, `Character`) or raw audio contexts  | `src/store/useInventoryStore.ts`                                                       |
| Domain Logic (`src/features/character/stats.ts`, `src/features/inventory/keyboard.ts`) | Pure calculations for effective stats, stat deltas, and keyboard grid coordinate calculations               | Direct React hook invocations or store mutations                 | `src/features/character/stats.ts`, `src/features/inventory/keyboard.ts`                |
| Data Layer (`src/features/*/use*Query.ts`, `src/mocks/`)                               | In-memory catalogs, mock latency simulation, and query cache entity resolution (`useItem`)                  | Session UI state (bag slot order, modal toggles, focus tracking) | `src/mocks/api.ts`, `src/features/inventory/useInventoryQuery.ts`                      |
| Audio Subsystem (`src/features/audio/`)                                                | Web Audio API context management, audio buffer decoding, asset preloading, and mute gating                  | Game logic, inventory capacity checks, or UI rendering           | `src/features/audio/useSound.ts`                                                       |
| Tooltip System (`src/features/inventory/tooltip/`)                                     | Floating UI placement calculations, autoUpdate subscriptions, and portal rendering                          | Inventory state alterations or character mutations               | `src/features/inventory/tooltip/ItemTooltipPresenter.tsx`                              |

### 4) Reused Patterns

| Pattern                        | Where found                                                                                 | Why it exists                                                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Pure Transition Reducers       | `src/store/useInventoryStore.ts` (`equipTransition`, `swapTransition`, `unequipTransition`) | Decouples state transition logic from Zustand and React lifecycle, enabling comprehensive zero-React unit testing.                  |
| Cache Entity Selector          | `src/features/inventory/useInventoryQuery.ts` (`useItem`)                                   | Resolves full `Item` entities from React Query cache by ID on demand, strictly preventing entity duplication in session state.      |
| Branded Primitives             | `src/types/domain.ts` (`ItemId = string & { readonly [itemIdBrand]: true }`)                | Enforces compile-time safety preventing arbitrary strings from being mistakenly passed as item IDs.                                 |
| Isolated Audio Engine Object   | `src/features/audio/useSound.ts` (`audioEngine.playback`)                                   | Separates playback invocation from the Web Audio context so tests can easily spy on or mock playback without headless audio errors. |
| Viewport-Aware Floating Portal | `src/features/inventory/tooltip/ItemTooltipPresenter.tsx` (`useFloating`, `FloatingPortal`) | Guarantees tooltips do not clip at viewport boundaries and escape parent stacking contexts.                                         |

### 5) Known Architectural Risks

- Documentation/Codebase Divergence on Drag-and-Drop: `README.md` and `tests/integration/dnd-test-utils.tsx` contain legacy text referencing `@dnd-kit/core`, while the application has transitioned to click-to-equip and keyboard navigation (Feature 004). This creates onboarding ambiguity.
- Unwrapped `act(...)` Warnings in RTL Tests: Multiple integration tests trigger React 19 state updates outside an explicit `act(...)` wrapper during async queries, producing warning noise in Vitest logs.
- Formatting Check Mismatch: Five files have formatting discrepancies with `.prettierrc`, causing `npm run lint` to fail even though ESLint passes with zero warnings.

### 6) Evidence

- `src/App.tsx`
- `src/store/useInventoryStore.ts`
- `src/features/character/stats.ts`
- `src/features/inventory/useInventoryQuery.ts`
- `src/features/inventory/tooltip/ItemTooltipPresenter.tsx`
- `src/types/domain.ts`
- `src/types/schemas.ts`
