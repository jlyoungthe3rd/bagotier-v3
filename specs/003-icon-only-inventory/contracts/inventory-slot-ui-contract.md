# Contract: Inventory Slot UI (Icon-Only)

**Feature**: `003-icon-only-inventory`

## Purpose

Define the user-visible rendering contract for occupied inventory blocks so they consistently show icon-only content.

## Consumers

- `src/features/inventory/InventoryGrid.tsx` (bag cells)
- `src/features/character/EquipmentSlot.tsx` (equipped item tiles)
- Shared renderer: `src/features/inventory/InventoryItem.tsx` and preview tile

## Contract rules

1. **Occupied block content**
   - MUST render the item icon as the primary in-block visual.
   - MUST NOT render item name text inside the inventory block.

2. **Accessibility**
   - MUST retain accessible naming (e.g., `aria-label` including item identity/context).
   - Accessible names are not considered visible in-slot text.

3. **Fallback behavior**
   - If icon data is missing/invalid, MUST render a defined non-text fallback visual state.
   - Fallback MUST still avoid in-slot text labels.

4. **Consistency**
   - MUST apply equally to bag and equipment slot item tiles wherever the shared inventory block renderer is used.

## Verification checklist

- Occupied bag slot shows icon and no name text.
- Occupied equipment slot shows icon and no name text.
- Drag preview tile shows icon-only content.
- Missing icon path shows fallback visual without text.
- Inventory item tiles keep accessible names (e.g., `Item Name (slot)`).
