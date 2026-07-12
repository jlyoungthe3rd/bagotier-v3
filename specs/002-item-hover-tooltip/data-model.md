# Data Model: Item Hover Tooltip

**Feature**: `002-item-hover-tooltip` | **Date**: 2026-07-12

This feature introduces runtime UI projection/state for tooltips and does not add persisted storage entities.

## Existing entities used

### Item (existing)

| Field | Type | Usage in this feature |
|-------|------|-----------------------|
| `id` | `ItemId` | Stable trigger identity for single-active-tooltip behavior |
| `name` | `string` | Primary tooltip heading/label text |
| `icon` | `string` | Optional visual included in tooltip context |
| `slotType` | `SlotType` | Secondary metadata shown in tooltip content |
| `modifiers` | `Partial<Record<StatKey, number>>` | Optional metadata lines (e.g., stat deltas) |

## New runtime projection models

### TooltipContent (derived)

| Field | Source | Rule |
|-------|--------|------|
| `title` | `item.name` | Required non-empty string for display |
| `subtitle` | `item.slotType` | Optional formatting string |
| `metadataLines` | `item.modifiers` and/or mapped fields | Optional; omit empty lines |
| `isEmpty` | Derived from mapped fields | If true, tooltip MUST NOT render (FR-007) |

### TooltipState (ephemeral UI state)

| Field | Type | Rule |
|-------|------|------|
| `activeItemId` | `ItemId \| null` | Exactly one active tooltip trigger at a time (FR-004) |
| `open` | `boolean` | True only while trigger is hovered/focused and content is not empty |
| `triggerMode` | `'hover' \| 'focus'` | Tracks interaction source for predictable dismissal semantics |
| `placement` | `'top' \| 'right' \| 'bottom' \| 'left'` (+ aligned variants) | Chosen by positioning middleware |
| `coords` | `{ x: number; y: number }` | Updated while open; bounded to viewport (FR-005) |

## Validation rules from requirements

- **FR-001/FR-002**: Tooltip renders when an eligible item trigger is hovered/focused and shows mapped item details.
- **FR-003**: Tooltip closes when pointer/focus leaves trigger (and on explicit dismiss such as `Escape` per research guidance).
- **FR-004**: Opening a new tooltip deactivates the previous `activeItemId` before rendering the next.
- **FR-005**: Positioning output must keep tooltip fully visible in viewport by flip/shift behavior.
- **FR-006**: Tooltip is non-interactive (`pointer-events` and role semantics) so unrelated controls remain usable.
- **FR-007**: If `TooltipContent.isEmpty` is true, no tooltip node is shown.
- **FR-008/FR-009**: Content and visibility update immediately to match newly hovered shared-item trigger across bag/equipment surfaces.

## State transitions

1. `idle` → `pending-open` on `mouseenter`/`focus` of eligible item.
2. `pending-open` → `open(itemA)` once content is resolved and open delay (if any) elapses.
3. `open(itemA)` → `open(itemB)` when pointer/focus moves to another eligible item (single-tooltip handoff).
4. `open(itemX)` → `idle` on `mouseleave`, `blur`, or `Escape`.
5. Any state → `idle` when trigger unmounts or content becomes empty.
