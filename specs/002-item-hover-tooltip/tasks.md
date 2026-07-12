# Tasks: Item Hover Tooltip

**Input**: Design documents from `/specs/002-item-hover-tooltip/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare tooltip dependency and feature scaffolding.

- [X] T001 Add Floating UI tooltip dependency in /Users/jlyoungthe3rd/Workspace/bagotierV3/package.json
- [X] T002 [P] Create tooltip feature folder and barrel export in /Users/jlyoungthe3rd/Workspace/bagotierV3/src/features/inventory/tooltip/index.ts
- [X] T003 [P] Add tooltip test utility helpers for hover/focus interactions in /Users/jlyoungthe3rd/Workspace/bagotierV3/tests/integration/item-tooltip-test-utils.tsx

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build shared tooltip primitives used by all user stories.  
**⚠️ CRITICAL**: Complete this phase before starting user stories.

- [X] T004 Implement tooltip content projection and empty-content detection in /Users/jlyoungthe3rd/Workspace/bagotierV3/src/features/inventory/tooltip/mapTooltipContent.ts
- [X] T005 [P] Implement single-active tooltip state controller with open/close lifecycle in /Users/jlyoungthe3rd/Workspace/bagotierV3/src/features/inventory/tooltip/useItemTooltipState.ts
- [X] T006 [P] Implement shared floating tooltip presenter (portal + role semantics) in /Users/jlyoungthe3rd/Workspace/bagotierV3/src/features/inventory/tooltip/ItemTooltipPresenter.tsx
- [X] T007 Wire tooltip provider/composition root into app shell in /Users/jlyoungthe3rd/Workspace/bagotierV3/src/App.tsx

**Checkpoint**: Shared tooltip infrastructure is ready for story implementation.

---

## Phase 3: User Story 1 - View Item Details on Hover (Priority: P1) 🎯 MVP

**Goal**: Show the correct item tooltip on hover/focus and close on leave/blur/Escape.  
**Independent Test**: Hover/focus any tooltip-enabled bag/equipment item and verify one correct tooltip appears, then dismisses on leave/blur/Escape.

### Tests for User Story 1

- [X] T008 [P] [US1] Add integration tests for hover/focus/escape open-close behavior in /Users/jlyoungthe3rd/Workspace/bagotierV3/tests/integration/item-tooltip-hover.test.tsx
- [X] T009 [P] [US1] Add UI contract tests for tooltip role and trigger association in /Users/jlyoungthe3rd/Workspace/bagotierV3/tests/contract/item-tooltip-ui.contract.test.tsx

### Implementation for User Story 1

- [X] T010 [US1] Add tooltip trigger wiring (`aria-describedby`, hover/focus handlers) in /Users/jlyoungthe3rd/Workspace/bagotierV3/src/features/inventory/InventoryItem.tsx
- [X] T011 [US1] Integrate tooltip state with bag cell item rendering in /Users/jlyoungthe3rd/Workspace/bagotierV3/src/features/inventory/InventoryGrid.tsx
- [X] T012 [US1] Integrate shared tooltip behavior for equipped item rendering in /Users/jlyoungthe3rd/Workspace/bagotierV3/src/features/character/EquipmentSlot.tsx
- [X] T013 [US1] Enforce empty-content no-render guard in /Users/jlyoungthe3rd/Workspace/bagotierV3/src/features/inventory/tooltip/mapTooltipContent.ts

**Checkpoint**: User Story 1 is independently functional and testable (MVP).

---

## Phase 4: User Story 2 - Avoid Tooltip Obstruction (Priority: P2)

**Goal**: Keep tooltip fully visible and avoid fully covering hovered items.  
**Independent Test**: Hover items near viewport edges/corners and confirm tooltip remains visible and non-obstructive.

### Tests for User Story 2

- [X] T014 [P] [US2] Add integration tests for viewport-safe tooltip placement and edge cases in /Users/jlyoungthe3rd/Workspace/bagotierV3/tests/integration/item-tooltip-placement.test.tsx
- [X] T015 [P] [US2] Add integration test coverage for non-blocking unrelated controls while tooltip is open in /Users/jlyoungthe3rd/Workspace/bagotierV3/tests/integration/item-tooltip-nonblocking.test.tsx

### Implementation for User Story 2

- [X] T016 [US2] Configure offset/flip/shift middleware and fallback placements in /Users/jlyoungthe3rd/Workspace/bagotierV3/src/features/inventory/tooltip/ItemTooltipPresenter.tsx
- [X] T017 [US2] Apply non-interactive tooltip styling (`pointer-events-none`) and layering tokens in /Users/jlyoungthe3rd/Workspace/bagotierV3/src/index.css
- [X] T018 [US2] Tune placement strategy to avoid full trigger coverage in /Users/jlyoungthe3rd/Workspace/bagotierV3/src/features/inventory/tooltip/useItemTooltipState.ts

**Checkpoint**: User Story 2 is independently functional and testable.

---

## Phase 5: User Story 3 - Stable Tooltip Behavior During Rapid Movement (Priority: P3)

**Goal**: Ensure predictable single-tooltip handoff during fast pointer transitions between items.  
**Independent Test**: Rapidly move across adjacent items and verify old tooltip closes before new tooltip content appears, with no overlap.

### Tests for User Story 3

- [X] T019 [P] [US3] Add rapid-transition integration tests for single-tooltip handoff in /Users/jlyoungthe3rd/Workspace/bagotierV3/tests/integration/item-tooltip-rapid-movement.test.tsx
- [X] T020 [P] [US3] Add unit tests for tooltip state transitions and timer cleanup in /Users/jlyoungthe3rd/Workspace/bagotierV3/tests/unit/item-tooltip-state.test.ts

### Implementation for User Story 3

- [X] T021 [US3] Implement race-safe active-item handoff logic in /Users/jlyoungthe3rd/Workspace/bagotierV3/src/features/inventory/tooltip/useItemTooltipState.ts
- [X] T022 [US3] Update trigger enter/leave handling to prevent overlapping visibility during rapid movement in /Users/jlyoungthe3rd/Workspace/bagotierV3/src/features/inventory/InventoryItem.tsx
- [X] T023 [US3] Ensure consistent shared-tooltip behavior across inventory and equipment surfaces in /Users/jlyoungthe3rd/Workspace/bagotierV3/src/features/inventory/tooltip/ItemTooltipPresenter.tsx

**Checkpoint**: User Story 3 is independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final quality, documentation, and validation across all stories.

- [X] T024 [P] Add/refresh unit coverage for tooltip content projection edge cases in /Users/jlyoungthe3rd/Workspace/bagotierV3/tests/unit/item-tooltip-content.test.ts
- [X] T025 [P] Update tooltip validation walkthrough and expected results in /Users/jlyoungthe3rd/Workspace/bagotierV3/specs/002-item-hover-tooltip/quickstart.md
- [X] T026 Document final implementation notes and constitutional compliance evidence in /Users/jlyoungthe3rd/Workspace/bagotierV3/specs/002-item-hover-tooltip/plan.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies.
- **Phase 2 (Foundational)**: Depends on Phase 1; blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2.
- **Phase 4 (US2)**: Depends on Phase 2 and can proceed in parallel with US1 once foundational components exist.
- **Phase 5 (US3)**: Depends on Phase 2 and is safest after US1 baseline behavior is in place.
- **Phase 6 (Polish)**: Depends on completion of all targeted user stories.

### User Story Dependency Graph

- **US1 (P1)** → establishes core tooltip behavior (MVP baseline).
- **US2 (P2)** → extends placement and non-obstruction behavior on top of shared tooltip infrastructure.
- **US3 (P3)** → hardens transition stability and single-tooltip guarantees for dense/rapid interactions.

### Within-Story Execution Rules

- Write tests first where listed (T008/T009, T014/T015, T019/T020) and confirm they fail before implementation.
- Complete shared model/state tasks before trigger wiring changes.
- Run story-specific tests before moving to the next story phase.

---

## Parallel Opportunities

- **Setup**: T002 and T003 can run in parallel.
- **Foundational**: T005 and T006 can run in parallel after T004 starts.
- **US1**: T008 and T009 can run in parallel; T011 and T012 can run in parallel after T010.
- **US2**: T014 and T015 can run in parallel.
- **US3**: T019 and T020 can run in parallel.
- **Polish**: T024 and T025 can run in parallel.

## Parallel Example: User Story 1

```bash
# Parallel tests
Task T008: tests/integration/item-tooltip-hover.test.tsx
Task T009: tests/contract/item-tooltip-ui.contract.test.tsx

# Parallel surface integrations after trigger wiring
Task T011: src/features/inventory/InventoryGrid.tsx
Task T012: src/features/character/EquipmentSlot.tsx
```

## Parallel Example: User Story 2

```bash
# Parallel validation coverage
Task T014: tests/integration/item-tooltip-placement.test.tsx
Task T015: tests/integration/item-tooltip-nonblocking.test.tsx
```

## Parallel Example: User Story 3

```bash
# Parallel stability test coverage
Task T019: tests/integration/item-tooltip-rapid-movement.test.tsx
Task T020: tests/unit/item-tooltip-state.test.ts
```

---

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1 and Phase 2.
2. Deliver Phase 3 (US1) end-to-end.
3. Validate US1 independently with T008 and T009 before expanding scope.

### Incremental Delivery

1. Build shared foundation once (Phases 1–2).
2. Ship **US1 (MVP)**.
3. Add **US2** placement quality enhancements.
4. Add **US3** rapid-movement stability hardening.
5. Finish with Phase 6 polish/documentation.

### Team Parallelization

1. Team aligns on Phases 1–2.
2. After foundation:
   - Engineer A: US1 surface wiring
   - Engineer B: US2 placement/non-blocking behavior
   - Engineer C: US3 transition stability
3. Merge behind passing story-specific test checkpoints.

---

## Notes

- All tasks use strict checklist format: `- [X] T### [P?] [US?] Description with file path`.
- `[US#]` labels are only applied in user story phases.
- Tasks are dependency-ordered and executable without additional planning context.
