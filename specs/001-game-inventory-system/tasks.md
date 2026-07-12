# Tasks: Game Inventory Management Experience

**Input**: Design documents from `/specs/001-game-inventory-system/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md, contracts/ (item-schema.md, character-schema.md, store-contracts.md)

**Tests**: INCLUDED — Constitution Principle II (Testing Standards) is non-negotiable and the plan mandates Vitest unit, contract (Zod), and integration coverage. Tests are written first (red) within each phase.

**Organization**: Tasks are grouped by user story (spec.md priorities: US1 = P1 drag-and-drop equip MVP; US2/US3 = P2 stat updates and unequip/swap; US4/US5 = P3 sound effects and character presentation).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story the task belongs to (US1–US5)
- Every task includes exact file paths

## Path Conventions

Single Vite SPA at repository root: `src/`, `tests/` (per plan.md Project Structure).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Scaffold the Vite + strict TypeScript project with all mandated dependencies and tooling.

- [x] T001 Scaffold Vite 5 `react-ts` project at repository root (`package.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`)
- [x] T002 Configure strict TypeScript in `tsconfig.json` (`"strict": true`, `noUncheckedIndexedAccess`, `noFallthroughCasesInSwitch`, `verbatimModuleSyntax`, ES2022 target) per research.md R1
- [x] T003 Install runtime dependencies: `react`, `react-dom`, `@tanstack/react-query`, `zustand`, `@dnd-kit/core`, `@dnd-kit/utilities`, `framer-motion`, `tailwindcss` (update `package.json`)
- [x] T004 [P] Configure Tailwind CSS with design tokens in `tailwind.config.ts` (`slot-valid`, `slot-invalid`, `slot-idle`, buff/debuff stat-delta colors, grid spacing, WCAG AA contrast pairs per research.md R6) and Tailwind directives in `src/index.css`
- [x] T005 [P] Configure ESLint (typescript-eslint strict) + Prettier with zero-error scripts (`lint`, `format`) in `.eslintrc.cjs`, `.prettierrc`, and `package.json`
- [x] T006 [P] Configure Vitest + React Testing Library + user-event in `vitest.config.ts` and `tests/setup.ts` (jsdom environment, `npm test` script, RTL cleanup, Web Audio mock stub)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Domain types, contracts, mock data layer, query wiring, and the Zustand store — everything every user story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T007 Define domain types in `src/types/domain.ts`: branded `ItemId`, `SlotType` (7-value union), `StatKey` (`hp|mp|def|str`), `Item`, `Character`, `CharacterAppearance`, `EquipmentState`, `DragOrigin`, `DropOutcome`, `BAG_CAPACITY = 24` (per data-model.md)
- [x] T008 [P] Implement Zod schemas from contracts in `src/types/schemas.ts`: `SlotTypeSchema`, `ItemSchema`, `ItemCatalogSchema`, `CharacterSchema`, `DragOriginSchema`, `InventoryStoreStateSchema` (per contracts/item-schema.md, contracts/character-schema.md, contracts/store-contracts.md)
- [x] T009 [P] Create query key factory in `src/lib/queryKeys.ts` (`queryKeys.items = ['items'] as const`, `queryKeys.character = ['character'] as const`) per store-contracts.md rule 4
- [x] T010 [P] Create React Query client config in `src/lib/queryClient.ts` (`staleTime: Infinity` defaults for immutable mocks per research.md R3)
- [x] T011 [P] Write contract test validating item catalog in `tests/contract/items.contract.test.ts` (parses with `ItemCatalogSchema`, ≥10 items, all 7 slot types covered — FR-013) — must FAIL until T014
- [x] T012 [P] Write contract test validating character in `tests/contract/character.contract.test.ts` (parses with `CharacterSchema`, all stats present and ≥ 0) — must FAIL until T015
- [x] T013 [P] Write contract test for store shape in `tests/contract/store.contract.test.ts` (initial state parses with `InventoryStoreStateSchema`; property-style random action sequences preserve invariants I1–I3; no `Item`-shaped objects in state — invariant I5) — must FAIL until T017
- [x] T014 [P] Create seed item catalog in `src/mocks/items.ts` (≥10 typed items covering every `SlotType`, mix of positive/negative/absent modifiers per FR-004/FR-013)
- [x] T015 [P] Create generated character in `src/mocks/character.ts` (deterministic-random appearance seed/parts + randomized base stats within ranges per research.md R9)
- [x] T016 Create async mock fetchers in `src/mocks/api.ts` (`fetchItems`, `fetchCharacter` resolving after ~150 ms simulated latency per research.md R3)
- [x] T017 Implement Zustand store in `src/store/useInventoryStore.ts` with state (`equipped`, `bag`, `muted`, `activeDrag`) and pure named actions `startDrag`, `equip`, `swap`, `unequip` (returns `'bag-full'` rejection), `moveInBag`, `cancelDrag`, `toggleMute` — ID-only, transitions as pure `(state, args) → state` functions (data-model.md state transitions, store-contracts.md actions contract)
- [x] T018 Implement query hooks: `src/features/inventory/useInventoryQuery.ts` (item catalog + `useItem(id)` ID-resolution selector per store-contracts.md rule 2) and `src/features/character/useCharacterQuery.ts`
- [x] T019 Wire `QueryClientProvider` in `src/main.tsx` and build the base screen layout shell in `src/App.tsx` with designed loading (skeleton), empty, and error (retry) states for the queries (Constitution III)

**Checkpoint**: Foundation ready — contract tests (T011–T013) pass; user story implementation can now begin.

---

## Phase 3: User Story 1 - Equip an Item via Drag and Drop (Priority: P1) 🎯 MVP

**Goal**: User drags an item from the inventory grid onto a matching equipment slot to equip it; invalid/empty-space drops return the item with clear visual feedback; compatible slots highlight during drag.

**Independent Test**: Load the screen with a character, ≥1 item in the inventory, and empty slots; drag the item to its matching slot and verify it is equipped and removed from the grid; drag onto a non-matching slot and verify rejection + return to origin.

### Tests for User Story 1 (write first — must FAIL before implementation)

- [x] T020 [P] [US1] Unit tests for store `equip` and `cancelDrag` transitions in `tests/unit/store-equip.test.ts` (equip moves ID bag→slot, slot-type mismatch no-ops, cancel preserves ownership — FR-003/FR-012, invariants I1/I2)
- [x] T021 [P] [US1] Integration test for drag-equip flow in `tests/integration/equip-flow.test.tsx` (dnd-kit keyboard-sensor simulation: valid equip removes item from grid and fills slot; invalid slot drop and empty-space drop return item to origin; compatible slot highlights during drag — US1 acceptance scenarios 1–4)

### Implementation for User Story 1

- [x] T022 [P] [US1] Implement draggable item tile in `src/features/inventory/InventoryItem.tsx` (`useDraggable` with `data: { itemId, slotType, origin }`, icon + name rendering, empty cells not draggable)
- [x] T023 [P] [US1] Implement droppable inventory grid in `src/features/inventory/InventoryGrid.tsx` (24-cell grid of `useDroppable` cells rendering bag IDs resolved via `useItem`)
- [x] T024 [P] [US1] Implement droppable equipment slot in `src/features/character/EquipmentSlot.tsx` (`useDroppable` per slot with idle/valid/invalid highlight states driven by Tailwind tokens — FR-005)
- [x] T025 [US1] Implement DndContext handlers in `src/features/inventory/dnd.ts`: `onDragStart` → `startDrag`; `onDragOver` → validity computation for highlights; `onDragEnd` → resolve single `DropOutcome` (`equip` | `invalid` | `cancelled` for this story) and dispatch exactly one store action (research.md R4, FR-003/FR-012) (depends on T022–T024)
- [x] T026 [US1] Compose the screen in `src/App.tsx`: root `DndContext` with `pointerWithin` + `rectIntersection` collision detection, `DragOverlay` rendering the dragged tile, `PointerSensor` + `KeyboardSensor` with screen-reader announcements, placeholder character area with the 7 slots, inventory grid below/beside (depends on T025)
- [x] T027 [US1] Add invalid-drop visual feedback (brief Framer Motion flash/shake on rejected target and item return-to-origin) in `src/features/character/EquipmentSlot.tsx` and `src/features/inventory/dnd.ts` (US1 acceptance scenario 2)

**Checkpoint**: US1 fully functional — drag-and-drop equipping works end to end. This is the demonstrable MVP.

---

## Phase 4: User Story 2 - Character Stats Update with Equipment (Priority: P2)

**Goal**: A stat panel shows effective stats (base + summed equipped modifiers) that update immediately on equip/unequip, with changed stats visually highlighted and base-vs-bonus discernible.

**Independent Test**: Equip an item with known bonuses and verify the panel shows base + bonus; unequip and verify it reverts to base; verify multi-item sums and delta highlight.

### Tests for User Story 2 (write first — must FAIL before implementation)

- [x] T028 [P] [US2] Unit tests for `computeEffectiveStats` in `tests/unit/stats.test.ts` (base + single modifier, multi-item summation, negative modifiers clamped at 0, absent modifiers ignored — FR-006/FR-011, data-model.md EffectiveStats)
- [x] T029 [P] [US2] Integration test for stat panel in `tests/integration/stat-panel.test.tsx` (equip helmet +5 DEF → DEF shows base+5; unequip → reverts; multiple items sum; changed stat shows delta highlight — US2 acceptance scenarios 1–4)

### Implementation for User Story 2

- [x] T030 [P] [US2] Implement pure stat computation in `src/features/character/stats.ts` (`computeEffectiveStats(base, equippedItems)` with 0-clamp, plus `computeDeltas(base, effective)` for FR-014)
- [x] T031 [US2] Implement stat panel in `src/features/character/StatPanel.tsx` (derives effective stats from store equipped IDs + `useItem` resolution — never stored; renders each stat with effective value and base-vs-bonus delta; Framer Motion pulse on change, respecting `useReducedMotion` — FR-006/FR-014) (depends on T030)
- [x] T032 [US2] Integrate `StatPanel` into the screen layout in `src/App.tsx` adjacent to the character area (depends on T031)

**Checkpoint**: US1 + US2 work — equipping visibly changes stats instantly (≤100 ms budget, SC-002).

---

## Phase 5: User Story 3 - Unequip an Item (Priority: P2)

**Goal**: User drags an equipped item from its slot back to the inventory to unequip it; dropping a compatible item on an occupied slot swaps; unequip into a full bag is rejected with feedback.

**Independent Test**: Start with an equipped item, drag it from its slot to the grid, verify the slot empties and the item returns; drop a second compatible item on the occupied slot and verify the swap.

### Tests for User Story 3 (write first — must FAIL before implementation)

- [x] T033 [P] [US3] Unit tests for store `swap`, `unequip`, and `moveInBag` transitions in `tests/unit/store-unequip-swap.test.ts` (swap places displaced item in incoming item's bag cell; unequip targets free/targeted cell; full-bag returns `'bag-full'`; invariants I1–I3 hold — FR-007/FR-008, US3-AS3)
- [x] T034 [P] [US3] Integration test for unequip and swap flows in `tests/integration/unequip-swap-flow.test.tsx` (drag helmet slot→grid empties slot and returns item; drop new head item on occupied head slot swaps; full-bag unequip prevented with visible message — US3 acceptance scenarios 1–3)

### Implementation for User Story 3

- [x] T035 [US3] Make equipped items draggable out of slots in `src/features/character/EquipmentSlot.tsx` (`useDraggable` on slot contents with `origin: { kind: 'slot', slot }`)
- [x] T036 [US3] Extend drop-outcome resolution in `src/features/inventory/dnd.ts` with `unequip`, `swap`, and `moveInBag` outcomes (slot→grid unequips to targeted/first-free cell; bag-item→occupied-compatible-slot swaps; bag-cell→bag-cell reorders — FR-007/FR-008) (depends on T035)
- [x] T037 [US3] Add full-bag rejection feedback (non-blocking toast/message when `unequip` returns `'bag-full'`) in `src/features/inventory/dnd.ts` and a feedback element in `src/App.tsx` (US3 acceptance scenario 3)
- [x] T038 [US3] Add Framer Motion equip/unequip slot transitions (`AnimatePresence` + scale/opacity on slot contents, transform/opacity only, `useReducedMotion` honored) in `src/features/character/EquipmentSlot.tsx` (research.md R5)

**Checkpoint**: Full manage-inventory loop works — equip, unequip, swap, reorder; stats stay consistent throughout.

---

## Phase 6: User Story 4 - Sound Effects for Main Interactions (Priority: P3)

**Goal**: Distinct sounds for pickup, equip (incl. swap), unequip, and invalid/cancelled drop — each exactly once per interaction, silenced by an accessible mute toggle, degrading gracefully before the first user gesture.

**Independent Test**: Perform each interaction and verify the correct distinct sound plays exactly once; mute and verify silence for all interactions.

### Tests for User Story 4 (write first — must FAIL before implementation)

- [x] T039 [P] [US4] Unit tests for `useSound` in `tests/unit/useSound.test.ts` (no-op when muted; fresh `AudioBufferSourceNode` per play; silent no-op before `AudioContext` is available — FR-010, autoplay edge case)
- [x] T040 [P] [US4] Integration test for exactly-once sound playback in `tests/integration/sound-once.test.tsx` (spy on `useSound` boundary: pickup on drag start, equip on valid drop, unequip on slot→grid, invalid sound on bad drop — each exactly once; zero sounds when muted — US4 acceptance scenarios 1–5, SC-004)

### Implementation for User Story 4

- [x] T041 [P] [US4] Add four CC0/public-domain audio assets in `public/sounds/` (`pickup.mp3`, `equip.mp3`, `unequip.mp3`, `invalid.mp3`) and the typed sound registry in `src/features/audio/sounds.ts` (data-model.md SoundEffect)
- [x] T042 [US4] Implement idempotent playback hook in `src/features/audio/useSound.ts` (lazy `AudioContext` created/resumed on first user gesture, preloaded decoded `AudioBuffer`s, `play(effect)` no-ops when muted — research.md R7) (depends on T041)
- [x] T043 [P] [US4] Implement accessible mute control in `src/features/audio/MuteToggle.tsx` (button with `aria-pressed`, wired to store `toggleMute`/`muted` — FR-010)
- [x] T044 [US4] Wire sound playback at the two single call sites in `src/features/inventory/dnd.ts` (`onDragStart` → pickup; drop-outcome resolution → equip/swap → equip sound, unequip → unequip sound, invalid/cancelled → invalid sound, moveInBag → none) and mount `MuteToggle` in `src/App.tsx` (depends on T042, T043)

**Checkpoint**: All four interactions produce distinct, exactly-once audio; mute is honored globally.

---

## Phase 7: User Story 5 - Generated Character Presentation (Priority: P3)

**Goal**: A generated character is the visual centerpiece with equipment slots spatially arranged to body regions (head top, body middle, legs below, etc.), slots labeled/iconographic, equipped icons shown adjacent to their regions.

**Independent Test**: Load the app and verify a character renders with all 7 slots visible, identifiable, and spatially associated with the correct body regions.

### Tests for User Story 5 (write first — must FAIL before implementation)

- [x] T045 [P] [US5] Integration test for character presentation in `tests/integration/character-view.test.tsx` (character renders from query data; all 7 slots visible and labeled/identifiable; equipping shows the item icon in the region-adjacent slot — US5 acceptance scenarios 1–2)

### Implementation for User Story 5

- [x] T046 [US5] Implement generated character centerpiece in `src/features/character/CharacterView.tsx` (layered local SVG parts composed from `appearance` seed data via `useCharacterQuery` — research.md R9)
- [x] T047 [US5] Arrange the 7 `EquipmentSlot`s around the character by body region (head top, weapon/hands sides, body middle, legs/feet below, accessory) with labels/icons in `src/features/character/CharacterView.tsx` and update layout composition in `src/App.tsx` (depends on T046)

**Checkpoint**: All five user stories independently functional — full experience assembled.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Consistency under stress, accessibility, responsiveness, performance budgets, and validation.

- [x] T048 [P] Integration test for rapid-interaction consistency in `tests/integration/rapid-operations.test.tsx` (20 consecutive equip/swap/unequip actions leave stats, slots, and bag in a correct consistent state; no double-applied modifiers — FR-011, SC-006)
- [x] T049 [P] Add dev-mode console timing logger utility in `src/lib/devLog.ts` and instrument drop-outcome→stat-update timing in `src/features/inventory/dnd.ts` (plan.md observability scope, ≤100 ms budget check)
- [x] T050 [P] Responsive layout for smaller screens in `src/App.tsx` and `src/index.css` (character + inventory both remain usable, or enforced minimum size with a clear message — spec edge case)
- [x] T051 Accessibility pass: verify dnd-kit keyboard sensor operability end to end, screen-reader announcements text, WCAG AA contrast of all Tailwind tokens, `prefers-reduced-motion` coverage in `src/App.tsx`, `src/features/inventory/dnd.ts`, `tailwind.config.ts`
- [x] T052 Run `vite build` and verify bundle ≤ 250 KB gzipped; run full `npm test` + `npm run lint` zero-error gate; execute quickstart.md validation steps in `specs/001-game-inventory-system/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US1, P1)**: Depends on Phase 2
- **Phase 4 (US2, P2)**: Depends on Phase 2; integrates with US1's screen but stat logic (T028–T031) is independently buildable/testable
- **Phase 5 (US3, P2)**: Depends on Phase 2; extends US1's dnd handlers (T025) — store transitions (T033) are independent
- **Phase 6 (US4, P3)**: Depends on Phase 2; wiring task T044 touches US1/US3's `dnd.ts` — audio module itself (T041–T043) is independent
- **Phase 7 (US5, P3)**: Depends on Phase 2; replaces US1's placeholder character area
- **Phase 8 (Polish)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: None beyond Foundational — the MVP
- **US2 (P2)**: Pure logic independent; UI reads equipped IDs produced by US1
- **US3 (P2)**: Extends US1's drag pipeline (`dnd.ts`, `EquipmentSlot.tsx`)
- **US4 (P3)**: Audio module independent; final wiring hooks into US1/US3's outcome resolution
- **US5 (P3)**: Independent of US2–US4; refines US1's layout

### Within Each User Story

- Tests are written first and MUST fail before implementation
- Pure logic (store transitions, stats) before components; components before dnd wiring; wiring before App composition

### Parallel Opportunities

- **Setup**: T004, T005, T006 in parallel after T001–T003
- **Foundational**: T008–T010 in parallel after T007; contract tests T011–T013 in parallel; mocks T014–T015 in parallel
- **US1**: T020–T021 in parallel; components T022–T024 in parallel
- **Cross-story**: after Phase 2, US2's stat logic (T028, T030), US4's audio module (T039, T041–T043), and US5's CharacterView (T045–T046) can proceed in parallel with US1 by separate developers — only their App/dnd wiring tasks serialize
- **Polish**: T048–T050 in parallel

---

## Parallel Example: User Story 1

```bash
# Write both US1 tests together (red):
Task: "Unit tests for store equip/cancelDrag in tests/unit/store-equip.test.ts"
Task: "Integration test for drag-equip flow in tests/integration/equip-flow.test.tsx"

# Build the three independent components together:
Task: "Draggable item tile in src/features/inventory/InventoryItem.tsx"
Task: "Droppable inventory grid in src/features/inventory/InventoryGrid.tsx"
Task: "Droppable equipment slot in src/features/character/EquipmentSlot.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T006)
2. Complete Phase 2: Foundational (T007–T019) — CRITICAL, blocks all stories
3. Complete Phase 3: US1 (T020–T027)
4. **STOP and VALIDATE**: run `npm test`; manually drag an item into its matching slot, try an invalid slot, drop into empty space
5. Demo the MVP

### Incremental Delivery

1. Setup + Foundational → contract tests green, screen shell loads
2. US1 → drag-and-drop equipping → **MVP demo**
3. US2 → live stat panel → demo
4. US3 → unequip/swap/full-bag handling → demo
5. US4 → sound effects + mute → demo
6. US5 → generated character presentation → demo
7. Polish → rapid-ops consistency, a11y, responsive, budgets

### Parallel Team Strategy

After Phase 2: Developer A takes US1 (drag pipeline), Developer B takes US2 stat logic + US4 audio module (both pure/independent), Developer C takes US5 character visuals; wiring tasks (T032, T044, T047) land after US1's `dnd.ts`/`App.tsx` merge.

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- Verify every test task fails before implementing its counterparts (red-green, Constitution II)
- Zustand must never hold `Item` objects — IDs only (invariant I5, contract-tested in T013)
- All drop outcomes and their sounds resolve at exactly one call site in `dnd.ts` (exactly-once guarantee, SC-004)
- Commit after each task or logical group; stop at any checkpoint to validate the story independently
