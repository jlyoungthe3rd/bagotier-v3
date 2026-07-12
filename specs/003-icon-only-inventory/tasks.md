# Tasks: Icon-Only Inventory Slots

**Input**: Design documents from `/specs/003-icon-only-inventory/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish focused test scaffolding for this UI-only change.

- [X] T001 [P] Create icon-only inventory regression test scaffold in `tests/integration/inventory-icon-only.test.tsx`
- [X] T002 [P] Create shared InventoryItem rendering unit test scaffold in `tests/unit/inventory-item.test.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Prepare shared rendering path used by bag, equipment, and drag preview.

- [X] T003 Implement shared icon visual resolver (icon-or-fallback) for tile and preview in `src/features/inventory/InventoryItem.tsx`
- [X] T004 [P] Add deterministic missing-icon fixture support for integration tests in `tests/integration/dnd-test-utils.tsx`

**Checkpoint**: Shared rendering and test harness are ready; user stories can proceed.

---

## Phase 3: User Story 1 - View Clean Inventory Grid (Priority: P1) 🎯 MVP

**Goal**: Occupied inventory blocks render icon-only content with no visible in-slot text.

**Independent Test**: Open inventory with mixed items and verify bag cells, equipment tiles, and drag preview show icons only (no item-name text in slots).

### Tests for User Story 1

- [X] T005 [P] [US1] Implement icon-only occupied-slot assertions for bag, equipped slots, and drag preview in `tests/integration/inventory-icon-only.test.tsx`

### Implementation for User Story 1

- [X] T006 [US1] Remove visible item-name text element from draggable inventory tile in `src/features/inventory/InventoryItem.tsx`
- [X] T007 [US1] Remove visible item-name text element from drag overlay preview tile in `src/features/inventory/InventoryItem.tsx`
- [X] T008 [US1] Update existing inventory rendering expectations impacted by icon-only tiles in `tests/integration/character-view.test.tsx`

**Checkpoint**: US1 is complete and independently testable.

---

## Phase 4: User Story 2 - Keep Slot State Legible Without Text (Priority: P2)

**Goal**: Empty/unavailable states stay clear and missing icons render a non-text fallback visual.

**Independent Test**: Render occupied, empty, and missing-icon items; confirm slot states remain distinguishable and fallback remains text-free.

### Tests for User Story 2

- [X] T009 [P] [US2] Add missing-icon fallback and aria-label retention assertions in `tests/unit/inventory-item.test.tsx`
- [X] T010 [P] [US2] Add slot-state legibility and text-free fallback integration assertions in `tests/integration/inventory-icon-only.test.tsx`

### Implementation for User Story 2

- [X] T011 [US2] Render a non-text fallback visual when icon data is empty/invalid in `src/features/inventory/InventoryItem.tsx`
- [X] T012 [US2] Preserve empty/unavailable equipment slot visual cues while keeping in-slot text removed in `src/features/character/EquipmentSlot.tsx`

**Checkpoint**: US2 is complete and independently testable.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency checks, docs alignment, and cleanup.

- [X] T013 [P] Update verification checklist and execution notes for icon-only behavior in `specs/003-icon-only-inventory/contracts/inventory-slot-ui-contract.md`

---

## Dependencies & Execution Order

### Phase Dependencies

1. **Phase 1 (Setup)** → can start immediately
2. **Phase 2 (Foundational)** → depends on Phase 1 and blocks all user stories
3. **Phase 3 (US1)** → depends on Phase 2
4. **Phase 4 (US2)** → depends on Phase 2 (can run after US1 for safer incremental delivery)
5. **Phase 5 (Polish)** → depends on completed user stories

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational; no dependency on other stories.
- **US2 (P2)**: Starts after Foundational; validates fallback/legibility on top of shared icon-only rendering.

### Within-Story Order

- Test updates first (T005, T009, T010), then implementation (T006-T008, T011-T012).

## Parallel Opportunities

- **Setup**: T001 and T002 run in parallel.
- **Foundational**: T004 can run in parallel with T003.
- **US1**: T005 can run while implementation starts; finalize after T006-T007.
- **US2**: T009 and T010 run in parallel; T011 and T012 can proceed in parallel after test expectations are defined.

## Parallel Example: User Story 1

```bash
Task: "T005 [US1] Implement icon-only occupied-slot assertions in tests/integration/inventory-icon-only.test.tsx"
Task: "T006 [US1] Remove visible item-name text element from src/features/inventory/InventoryItem.tsx"
Task: "T007 [US1] Remove visible item-name text element from drag preview in src/features/inventory/InventoryItem.tsx"
```

## Parallel Example: User Story 2

```bash
Task: "T009 [US2] Add missing-icon fallback unit assertions in tests/unit/inventory-item.test.tsx"
Task: "T010 [US2] Add slot-state legibility integration assertions in tests/integration/inventory-icon-only.test.tsx"
Task: "T012 [US2] Preserve equipment slot state cues in src/features/character/EquipmentSlot.tsx"
```

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phase 1 + Phase 2
2. Deliver Phase 3 (US1)
3. Validate icon-only rendering in inventory grid, equipment tiles, and drag preview
4. Demo/release if acceptable

### Incremental Delivery

1. Ship US1 (icon-only occupied slots)
2. Add US2 hardening (fallback + legibility guarantees)
3. Finish with Phase 5 documentation polish
