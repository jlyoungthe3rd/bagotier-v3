# Research: Icon-Only Inventory Slots

**Feature**: `003-icon-only-inventory` | **Date**: 2026-07-12

All Technical Context entries were fully known from the existing codebase, so there are no unresolved NEEDS CLARIFICATION items.

## R1. Rendering approach for inventory blocks

- **Decision**: Remove the item-name text element from inventory block interiors and keep only the icon element.
- **Rationale**: This is the exact requested behavior and the simplest possible implementation path.
- **Alternatives considered**:
  - Hide text visually but keep it in DOM: rejected as unnecessary complexity for this request.
  - Add a feature flag: rejected because scope is a direct UI change, not a staged rollout.

## R2. Shared component scope

- **Decision**: Apply the change in the shared inventory tile renderer (`InventoryItem` and drag preview) so bag and equipment surfaces stay consistent.
- **Rationale**: One targeted change updates all consumers and avoids duplicated edits.
- **Alternatives considered**:
  - Per-screen overrides: rejected due to drift risk and extra maintenance.

## R3. Accessibility and metadata handling

- **Decision**: Keep `aria-label` on item tiles so item name/slot metadata remains available to assistive tech and for non-visual contexts.
- **Rationale**: Meets FR-004 (preserve item metadata outside slot interior) while removing visual text clutter.
- **Alternatives considered**:
  - Remove item names entirely: rejected because it would reduce accessibility and violate the spec intent.

## R4. Missing icon behavior

- **Decision**: Keep a non-text fallback visual state when icon data is unavailable (e.g., placeholder glyph/symbol), without rendering item-name text in-slot.
- **Rationale**: Satisfies FR-005 and avoids empty-looking broken tiles.
- **Alternatives considered**:
  - Render fallback text such as “No Icon”: rejected because in-slot text is explicitly disallowed.

## R5. Validation strategy

- **Decision**: Use focused UI validation (manual + automated) to assert icon-only occupied slots, no in-slot names, and fallback visual behavior.
- **Rationale**: Covers feature risk directly without introducing broad test churn.
- **Alternatives considered**:
  - Full visual-regression tooling rollout: rejected as disproportionate for this small UI-only change.
