# Implementation Plan: Keyboard Inventory Navigation

**Branch**: `004-keyboard-inventory-nav` | **Date**: 2026-07-12 | **Spec**: [spec.md](./spec.md)

## Summary

Add keyboard navigation support for the inventory bag grid and the paper doll equipment slots. Users can navigate cells/slots via arrow keys (roving `tabindex`), switch focus between the grid and paper doll via TAB/Shift+TAB, view tooltips on focus, and equip/unequip items using Space or Enter. A session-only TAB hint tooltip displays for discoverability.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19

**Primary Dependencies**: React, Zustand (store), `@floating-ui/react` (for tooltips)

**Storage**: Session-only (non-persisted store state)

**Testing**: Vitest + React Testing Library (`npm test`)

**Performance Goals**: Keyboard action response time ≤ 50ms; no bundle size or performance regressions.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.* (Constitution v1.0.0)

| Gate | Principle | Assessment | Status |
|------|-----------|------------|--------|
| CQ-1 | I. Code Quality | Roving tabindex state in existing Zustand store; clean event listener bindings; reusable slots | ✅ PASS |
| TS-1 | II. Testing Standards | Integration tests simulating keyboard navigation, keypress actions, and tooltip visibility | ✅ PASS |
| UX-1 | III. UX Consistency | Visible focus ring on active slots; tooltips identical to hover tooltips; screen-reader compatible | ✅ PASS |
| PR-1 | IV. Performance Requirements | Direct key handler mappings; no excessive re-renders | ✅ PASS |
| SG-1 | Simplicity default | Native HTML buttons, simple Zustand variables, and reuse of existing Tooltip provider | ✅ PASS |

**Initial Constitution Check: PASS**

## Project Structure

### Documentation

```text
specs/004-keyboard-inventory-nav/
├── plan.md
├── research.md
├── data-model.md
├── spec.md
└── tasks.md
```

### Source Code modifications

- **Zustand Store (`src/store/useInventoryStore.ts`)**: Add keyboard focus, TAB hint state, and corresponding transition logic.
- **Inventory Grid & Cells (`src/features/inventory/InventoryGrid.tsx`)**:
  - Empty slots render focusable buttons.
  - Implement arrow key listeners and `onFocus`/`onBlur` coordination.
- **Equipment Slot (`src/features/character/EquipmentSlot.tsx`)**:
  - Empty slots render focusable buttons.
  - Implement arrow key listeners and `onFocus`/`onBlur` coordination.
- **App/Main layout (`src/App.tsx`)**:
  - Integrate TAB hint tooltip component near the Character view.
  - Ref-based keyboard focus propagation so that programmatically focused elements receive visual and DOM focus.

## Focus Ring Aesthetics

Focus rings are styled using Tailwind CSS classes:
- Active focused slot: `focus-visible:outline focus-visible:outline-2 focus-visible:outline-slot-valid focus-visible:outline-offset-2` (matching existing `InventoryItem` style).
- We'll make sure empty slots also have a clear, custom focus ring.

## Complexity Tracking

No constitution violations requiring justification.
