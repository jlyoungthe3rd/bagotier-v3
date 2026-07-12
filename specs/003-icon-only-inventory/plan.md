# Implementation Plan: Icon-Only Inventory Slots

**Branch**: `003-icon-only-inventory` | **Date**: 2026-07-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-icon-only-inventory/spec.md`

## Summary

Keep this feature intentionally simple: remove in-slot item text so inventory blocks display only icons. Implement by updating the shared inventory tile rendering used by bag cells and equipment slots, preserving existing drag/drop behavior and accessibility labels.

## Technical Context

**Language/Version**: TypeScript 5.9, React 19

**Primary Dependencies**: React, @dnd-kit/core, Tailwind CSS, Framer Motion (existing only; no new dependencies)

**Storage**: N/A (UI-only rendering change)

**Testing**: Vitest + React Testing Library (`npm test`)

**Target Platform**: Modern desktop/mobile browsers via Vite SPA

**Project Type**: Frontend-only web application

**Performance Goals**: No measurable regression; preserve existing UI responsiveness (interactive response ≤ 100ms, initial load budget ≤ 3s default)

**Constraints**: Keep implementation minimal; do not alter inventory data model or drag/drop logic; no text rendered inside inventory blocks; preserve non-text fallback when icon is unavailable

**Scale/Scope**: Inventory tile rendering in shared components (`InventoryItem` and drag preview) across bag and equipment surfaces

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.* (Constitution v1.0.0)

| Gate | Principle | Assessment | Status |
|------|-----------|------------|--------|
| CQ-1 | I. Code Quality | Small, localized UI change in existing components; no new architectural layers | ✅ PASS |
| TS-1 | II. Testing Standards | Validation plan includes focused UI regression tests for icon-only rendering and fallback behavior | ✅ PASS |
| UX-1 | III. UX Consistency | Uses existing inventory component system; keeps labels via `aria-label`; preserves slot-state clarity | ✅ PASS |
| PR-1 | IV. Performance Requirements | Removes text nodes/classes from hot UI path; no new runtime work or dependencies | ✅ PASS |
| SG-1 | Simplicity default | Directly remove text elements from inventory blocks per request; avoid extra abstractions | ✅ PASS |

**Initial Constitution Check: PASS — no violations.**

**Post-Design Constitution Check (after Phase 1): PASS** — research, model, and contract artifacts keep scope constrained to presentation logic only, with no added complexity.

## Project Structure

### Documentation (this feature)

```text
specs/003-icon-only-inventory/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── inventory-slot-ui-contract.md
└── tasks.md             # Phase 2 output (/speckit.tasks), not created in this step
```

### Source Code (repository root)

```text
src/
├── features/
│   ├── inventory/
│   │   ├── InventoryItem.tsx        # Primary in-slot item rendering
│   │   └── InventoryGrid.tsx        # Bag cells consume InventoryItem
│   └── character/
│       └── EquipmentSlot.tsx        # Equipment slots consume InventoryItem
└── types/
    └── domain.ts                    # Item shape includes name/icon metadata

tests/
├── unit/                            # Add/update focused component/store tests if needed
└── integration/                     # Add/update inventory rendering behavior checks if needed
```

**Structure Decision**: Use existing single-project Vite frontend layout and modify only the shared inventory rendering path to achieve icon-only slots everywhere the inventory block component is used.

## Complexity Tracking

No constitution violations requiring justification.
