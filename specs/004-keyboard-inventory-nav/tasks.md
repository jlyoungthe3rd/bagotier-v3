# Tasks: Keyboard Inventory Navigation

**Input**: Design documents from `/specs/004-keyboard-inventory-nav/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup & Store Extension

**Purpose**: Add keyboard state to the store and write unit tests for the transition logic.

- [ ] T001 [P] Extend `EquipmentState` and `InventoryStore` interfaces in `src/types/domain.ts` with keyboard state fields: `focusedSection`, `focusedBagIndex`, `focusedSlot`, `tabHintDismissed`, `showTabHint`.
- [ ] T002 Implement store action functions (`setFocusedSection`, `setFocusedBagIndex`, `setFocusedSlot`, `dismissTabHint`, `triggerArrowKeyNav`) and movement resolvers in `src/store/useInventoryStore.ts`.
- [ ] T003 [P] Add unit tests validating keyboard state transitions (arrow movements, wrapping logic, tab state) in `tests/unit/keyboard-nav.test.ts`.

**Checkpoint**: Store logic and unit tests pass.

---

## Phase 2: Focusable UI Slots & Roving Tabindex

**Purpose**: Render focusable buttons for empty slots, and manage focus using roving `tabindex`.

- [ ] T004 Modify `src/features/inventory/InventoryGrid.tsx` (`BagCell`) to render a `<button>` when empty, setting its `tabIndex` dynamically based on `focusedSection` and `focusedBagIndex`.
- [ ] T005 Modify `src/features/character/EquipmentSlot.tsx` to render a `<button>` when empty, setting its `tabIndex` dynamically based on `focusedSection` and `focusedSlot`.
- [ ] T006 Implement a focus synchronization mechanism (e.g. via DOM refs and an effect) in `src/App.tsx` or features to programmatically `.focus()` the active element whenever the store's focus coordinates change.

**Checkpoint**: Empty slots can receive keyboard focus and show outline highlights.

---

## Phase 3: Arrow Key Grid Navigation

**Purpose**: Implement Up/Down/Left/Right navigation within each section.

- [ ] T007 Add keyboard handlers in `src/features/inventory/InventoryGrid.tsx` to catch arrow keys and trigger store movements in the bag.
- [ ] T008 Add keyboard handlers in `src/features/character/EquipmentSlot.tsx` (or `CharacterView.tsx`) to catch arrow keys and trigger store movements in equipment slots.
- [ ] T009 [P] Create initial integration tests in `tests/integration/keyboard-navigation.test.tsx` verifying grid navigation (arrow keys).

**Checkpoint**: Arrow keys move focus successfully between cells/slots in the same section.

---

## Phase 4: TAB Switching Between Sections

**Purpose**: Connect Bag and Paper Doll via TAB and Shift+TAB.

- [ ] T010 Implement `Tab` keydown intercept in `src/features/inventory/InventoryGrid.tsx` to programmatically move focus to the paper doll.
- [ ] T011 Implement `Shift+Tab` keydown intercept in `src/features/character/EquipmentSlot.tsx` to programmatically move focus back to the inventory grid.
- [ ] T012 [P] Add integration tests in `tests/integration/keyboard-navigation.test.tsx` verifying TAB/Shift+TAB section transitions.

**Checkpoint**: Users can TAB between the grid and paper doll.

---

## Phase 5: Action Confirmation (Space / Enter)

**Purpose**: Support equipping and unequipping using the keyboard.

- [ ] T013 Add `Space` and `Enter` keydown handlers on occupied and empty bag cells to trigger equip/swap.
- [ ] T014 Add `Space` and `Enter` keydown handlers on occupied and empty equipment slots to trigger unequip.
- [ ] T015 [P] Add integration tests in `tests/integration/keyboard-navigation.test.tsx` verifying Space/Enter actions (equip, swap, unequip, empty no-op).

**Checkpoint**: Items can be equipped and unequipped entirely via keyboard.

---

## Phase 6: Tooltip Parity & Polish

**Purpose**: Connect the tooltip system to empty slots and keyboard focus state.

- [ ] T016 Ensure focused empty slot buttons explicitly call `tooltip.dismiss()` (or `tooltip.closeFor`) on focus so active tooltips close when navigating to empty spaces.
- [ ] T017 Verify tooltip content and location align with the active focused button.

---

## Phase 7: TAB Hint Tooltip

**Purpose**: Render the transient discoverability hint tooltip.

- [ ] T018 Build the TAB hint tooltip component in `src/features/character/CharacterView.tsx` (or as a separate visual component) and display it near the paper doll when `showTabHint` is true.
- [ ] T019 Ensure the TAB hint tooltip dismisses when focus enters the paper doll.
- [ ] T020 [P] Add integration tests in `tests/integration/keyboard-navigation.test.tsx` verifying TAB hint lifecycle.

---

## Phase 8: Final Verification & Clean up

**Purpose**: Run the full test suite and clean up unused console logs.

- [ ] T021 Run all tests (`npm test`) and ensure zero ESLint/Prettier warnings.
- [ ] T022 Update the feature specification status to "Completed".
