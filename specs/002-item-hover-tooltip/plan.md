# Implementation Plan: Item Hover Tooltip

**Branch**: `002-item-hover-tooltip` | **Date**: 2026-07-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-item-hover-tooltip/spec.md`

## Summary

Implement a shared, accessible item hover tooltip for inventory and equipment tiles. Use the existing React + TypeScript UI stack, with a Floating UI-backed tooltip wrapper to enforce one-active-tooltip behavior, viewport-safe placement, and predictable hover/focus/escape interactions across all shared item surfaces.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19

**Primary Dependencies**: React, Floating UI (`@floating-ui/react`) for placement/interaction middleware, existing Tailwind CSS and Framer Motion styling/animation stack

**Storage**: N/A (runtime UI behavior only; no persistence changes)

**Testing**: Vitest + React Testing Library + `@testing-library/user-event` (`npm test`)

**Target Platform**: Modern web browsers (desktop first for hover), with capability-based fallback behavior for non-hover/coarse pointers

**Project Type**: Frontend-only web application (Vite SPA)

**Performance Goals**: Meet spec latency targets (SC-001/SC-002: show/hide within 0.2s) and constitution defaults (interactive response ≤ 100ms, initial load ≤ 3s baseline) with no perceptible UI regressions in dense grids

**Constraints**: Single visible tooltip at a time; no empty tooltip rendering; tooltip stays within viewport; tooltip remains non-interactive and does not block unrelated controls; behavior consistent across all screens using shared item rendering

**Scale/Scope**: Shared item tile surfaces used by inventory bag cells, equipment slots, and drag-adjacent rendering paths in the existing `src/features` frontend

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.* (Constitution v1.0.0)

| Gate | Principle | Assessment | Status |
|------|-----------|------------|--------|
| CQ-1 | I. Code Quality | Feature is scoped to shared UI components/hooks with clear single-responsibility boundaries; no unnecessary architectural layers planned | ✅ PASS |
| TS-1 | II. Testing Standards | Plan includes behavior tests for hover/focus/escape, single-tooltip visibility, viewport-safe placement, and rapid transitions | ✅ PASS |
| UX-1 | III. User Experience Consistency | Tooltip behavior is centralized in shared item rendering and follows accessibility semantics (`role="tooltip"`, keyboard parity) | ✅ PASS |
| PR-1 | IV. Performance Requirements | Positioning observers are active only while open; one-tooltip model limits runtime overhead in dense item layouts | ✅ PASS |
| SG-1 | Simplicity default | Reuses existing feature structure and adds focused tooltip abstraction only where needed for consistency | ✅ PASS |

**Initial Constitution Check: PASS — no violations.**

**Post-Design Constitution Check (after Phase 1): PASS** — generated data model, UI contract, and quickstart preserve a minimal, testable, shared-component design without constitutional violations.

## Project Structure

### Documentation (this feature)

```text
specs/002-item-hover-tooltip/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── item-tooltip-ui-contract.md
└── tasks.md             # Phase 2 output (/speckit.tasks), not created in this step
```

### Source Code (repository root)

```text
src/
├── features/
│   ├── inventory/
│   │   ├── InventoryItem.tsx          # Primary shared item trigger surface
│   │   ├── InventoryGrid.tsx          # Bag cells consume InventoryItem
│   │   └── dnd.ts                     # Existing drag behavior to keep intact
│   └── character/
│       └── EquipmentSlot.tsx          # Equipment slots consume InventoryItem
└── ...

tests/
├── integration/                       # Add tooltip interaction/placement behavior checks
├── unit/                              # Add focused tooltip state/logic tests as needed
└── contract/                          # Add or update UI behavior contract coverage
```

**Structure Decision**: Keep the current single-project frontend layout. Implement tooltip behavior at the shared inventory item layer so bag and equipment surfaces inherit the same interaction, accessibility, and placement rules.

## Complexity Tracking

No constitution violations requiring justification.

## Final implementation notes

- Added shared tooltip infrastructure under `src/features/inventory/tooltip/`:
  - `mapTooltipContent.ts` (content projection + empty guard),
  - `useItemTooltipState.ts` (single-active state and race-safe handoff),
  - `ItemTooltipPresenter.tsx` (Floating UI placement, portal rendering, tooltip semantics).
- Wired `ItemTooltipProvider` at the app shell level so both inventory bag and equipment surfaces inherit the same behavior through shared `InventoryItem` triggers.
- Applied non-interactive tooltip styling (`pointer-events-none`) and role semantics (`role="tooltip"` + `aria-describedby`) to meet accessibility and non-blocking constraints.
- Added integration/contract/unit coverage for:
  - hover/focus/escape behavior,
  - role/association contract checks,
  - placement metadata/fallback checks,
  - non-blocking control interaction,
  - rapid movement handoff,
  - tooltip state transitions and content mapping edge cases.

### Constitution compliance evidence

- **I. Code Quality**: tooltip behavior centralized in shared feature modules with focused responsibilities and no duplicated per-surface logic.
- **II. Testing Standards**: added test-first coverage across integration, contract, and unit layers tied to feature requirements.
- **III. UX Consistency**: bag and equipment now share identical tooltip semantics via `InventoryItem` + global provider composition.
- **IV. Performance Requirements**: Floating UI observers run only while tooltip is open (`whileElementsMounted: autoUpdate`) and only one tooltip is active at a time.
