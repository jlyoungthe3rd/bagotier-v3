# Data Model: Icon-Only Inventory Slots

**Feature**: `003-icon-only-inventory` | **Date**: 2026-07-12

This feature does not introduce new persisted entities. It changes how existing item data is projected into inventory UI blocks.

## Existing entities used

### Item (existing)

| Field | Type | Usage in this feature |
|-------|------|-----------------------|
| `id` | `ItemId` | Stable key for rendering |
| `name` | `string` | Kept for accessibility (`aria-label`) and out-of-slot contexts |
| `icon` | `string` | Primary visual content inside inventory block |
| `slotType` | `SlotType` | Included in accessible labeling, unchanged behavior |

## UI projection model (render contract)

### InventoryBlockView (derived)

| Field | Source | Rule |
|-------|--------|------|
| `iconVisual` | `item.icon` | Render inside occupied block as the only intended visible content |
| `hasIcon` | `Boolean(item.icon)` | If false, render a non-text fallback visual state |
| `accessibleLabel` | `item.name + slotType` | Required for assistive technology; not rendered as visible in-slot text |

## Validation rules from requirements

- **FR-001/FR-002**: Occupied slots render icon-only content (no visible item-name text inside blocks).
- **FR-003**: Empty/unavailable slot visuals remain distinguishable using existing slot chrome/states.
- **FR-004**: Item name metadata remains available outside slot interior and through accessibility labeling.
- **FR-005**: Missing icon path renders a non-text fallback visual.
- **FR-006**: Behavior is consistent anywhere shared inventory block rendering is used.

## State transitions

No new state transitions are added. Existing drag/drop and inventory state transitions remain unchanged; only presentation output is adjusted.
