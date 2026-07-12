# Contract: Shared Item Tooltip UI

**Feature**: `002-item-hover-tooltip`

## Purpose

Define the user-visible and accessibility behavior contract for tooltips triggered from shared item components.

## Consumers

- `src/features/inventory/InventoryItem.tsx` (shared tooltip trigger)
- `src/features/inventory/InventoryGrid.tsx` (bag cells via shared item trigger)
- `src/features/character/EquipmentSlot.tsx` (equipment slots via shared item trigger)
- Tooltip presenter component/hook introduced for this feature (shared across item surfaces)

## Contract rules

1. **Trigger behavior**
   - MUST open tooltip when a tooltip-enabled item trigger is hovered.
   - MUST support keyboard parity by opening on focus.
   - MUST close on leave/blur and explicit dismiss (`Escape`).

2. **Content behavior**
   - MUST render content mapped from the currently active item only.
   - MUST NOT render an empty tooltip shell when mapped content is absent.
   - MUST update content when moving between items without overlapping multiple tooltips.

3. **Visibility and placement**
   - MUST keep exactly one tooltip visible at a time.
   - MUST position the tooltip so it remains fully visible in viewport bounds.
   - MUST avoid fully covering the trigger item in normal placement scenarios.

4. **Interaction and accessibility**
   - Tooltip container MUST use `role="tooltip"` and be associated to trigger via accessible relationship (`aria-describedby` or equivalent).
   - Tooltip content MUST remain non-interactive (no focusable controls).
   - Tooltip rendering MUST NOT block interaction with unrelated page controls.

5. **Cross-surface consistency**
   - All screens using shared item triggers (bag + equipment) MUST inherit identical tooltip visibility/content rules.

## Verification checklist

- Hovering an item shows one tooltip with the correct item details.
- Leaving the item hides tooltip within the expected response window.
- Focusing an item via keyboard shows tooltip; pressing `Escape` dismisses it.
- Rapid movement between adjacent items swaps tooltip target without overlap.
- Edge-positioned items still produce fully visible tooltip placement.
- Items lacking tooltip content render no empty tooltip.
