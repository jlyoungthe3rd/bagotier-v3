# Data Model: Keyboard Inventory Navigation

**Feature**: `004-keyboard-inventory-nav` | **Date**: 2026-07-12

This feature introduces new UI state properties to track keyboard focus position, active navigation modes, and the TAB hint tooltip state.

## State Extensions in `useInventoryStore`

We add the following fields to `EquipmentState` and `InventoryStore`:

### Primitives/Properties

| Field | Type | Initial Value | Description |
|-------|------|---------------|-------------|
| `focusedSection` | `'bag' \| 'equipment' \| null` | `null` | Which section currently holds keyboard focus. |
| `focusedBagIndex` | `number` | `0` | Index of the bag cell focused when navigating the bag. |
| `focusedSlot` | `SlotType` | `'head'` | Slot type focused when navigating the paper doll. |
| `tabHintDismissed` | `boolean` | `false` | Tracks if the user has dismissed the TAB hint in this session. |
| `showTabHint` | `boolean` | `false` | Tracks whether the TAB hint tooltip is currently visible. |

### Store Actions

- `setFocusedSection(section: 'bag' | 'equipment' | null): void`
- `setFocusedBagIndex(index: number): void`
- `setFocusedSlot(slot: SlotType): void`
- `dismissTabHint(): void`
- `triggerArrowKeyNav(): void` (sets `showTabHint` to true if `tabHintDismissed` is false)

## State Transition Rules

### 1. Arrow Key Movement inside Bag
When `focusedSection === 'bag'` and an arrow key is pressed:
- **Right**: If `focusedBagIndex % 4 < 3`, `focusedBagIndex = focusedBagIndex + 1`. If `focusedBagIndex % 4 === 3` and `focusedBagIndex < 23`, `focusedBagIndex = focusedBagIndex + 1` (wrap).
- **Left**: If `focusedBagIndex % 4 > 0`, `focusedBagIndex = focusedBagIndex - 1`. If `focusedBagIndex % 4 === 0` and `focusedBagIndex > 0`, `focusedBagIndex = focusedBagIndex - 1` (wrap).
- **Down**: If `focusedBagIndex + 4 < 24`, `focusedBagIndex = focusedBagIndex + 4`.
- **Up**: If `focusedBagIndex - 4 >= 0`, `focusedBagIndex = focusedBagIndex - 4`.

### 2. Arrow Key Movement inside Paper Doll
When `focusedSection === 'equipment'` and an arrow key is pressed, navigate according to this map:

```typescript
const SLOT_NAV_MAP: Record<SlotType, Record<'Up' | 'Down' | 'Left' | 'Right', SlotType>> = {
  head:      { Up: 'head',      Down: 'body',      Left: 'weapon',    Right: 'accessory' },
  weapon:    { Up: 'head',      Down: 'hands',     Left: 'weapon',    Right: 'body' },
  hands:     { Up: 'weapon',    Down: 'legs',      Left: 'hands',     Right: 'body' },
  body:      { Up: 'head',      Down: 'legs',      Left: 'weapon',    Right: 'accessory' },
  accessory: { Up: 'head',      Down: 'feet',      Left: 'body',      Right: 'accessory' },
  legs:      { Up: 'body',      Down: 'feet',      Left: 'hands',     Right: 'accessory' },
  feet:      { Up: 'legs',      Down: 'feet',      Left: 'hands',     Right: 'accessory' }
};
```

### 3. Section Transitions
- **TAB (on Bag)**: Set `focusedSection = 'equipment'`. Focus is shifted to `focusedSlot`. Set `showTabHint = false`, `tabHintDismissed = true`.
- **Shift+TAB (on Paper Doll)**: Set `focusedSection = 'bag'`. Focus is shifted to `focusedBagIndex`.

### 4. Interactive Action Dispatch (Space / Enter)
- **Within Bag**: If `bag[focusedBagIndex]` holds `itemId`:
  - Find item's `slotType`.
  - If `equipped[slotType] === null`, call `equip(itemId, slotType)`.
  - If `equipped[slotType] !== null`, call `swap(itemId, slotType)`.
- **Within Paper Doll**: If `equipped[focusedSlot]` is occupied, call `unequip(focusedSlot)`.
