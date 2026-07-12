# Data Model: Game Inventory Management Experience

**Feature**: `001-game-inventory-system` | **Date**: 2026-07-11

All entities are client-side TypeScript types (defined in `src/types/domain.ts`, validated
by the Zod schemas in [contracts/](./contracts/)). There is no database; ownership is
split between the **React Query cache** (entity data, read-only mocks) and the
**Zustand store** (session state holding only IDs — never entity copies).

## Ownership map

| Data | Owner | Notes |
|------|-------|-------|
| Item catalog (`Item[]`) | React Query (`['items']`) | Immutable mock data, `staleTime: Infinity` |
| Character identity + base stats | React Query (`['character']`) | Generated at load |
| Equipped state, bag layout, mute, drag state | Zustand | References items by `ItemId` only |
| Effective stats | Derived | Computed: base + equipped modifiers (never stored) |

## Entities

### SlotType (enum)

```
'head' | 'body' | 'legs' | 'hands' | 'feet' | 'weapon' | 'accessory'
```

Fixed set per spec assumption; exhaustively switched (strict TS enforces coverage).

### StatKey (enum)

```
'hp' | 'mp' | 'def' | 'str'   (v1 minimum; extensible per spec assumption)
```

### Item

| Field | Type | Rules |
|-------|------|-------|
| `id` | `ItemId` (branded string) | Unique across catalog; primary key |
| `name` | `string` | Non-empty; consistent terminology (Constitution III) |
| `icon` | `string` | Asset path/emoji identifier; non-empty |
| `slotType` | `SlotType` | Determines the only slot that accepts it (FR-003/FR-004) |
| `modifiers` | `Partial<Record<StatKey, number>>` | Integers; may be positive, negative, or absent per stat (FR-004) |

**Validation**: catalog must contain ≥ 10 items and cover every `SlotType` at least once
(FR-013) — enforced by contract test.

### Character

| Field | Type | Rules |
|-------|------|-------|
| `id` | `string` | Single character in v1 |
| `name` | `string` | Generated |
| `appearance` | `CharacterAppearance` | Seed/part identifiers for the generated visual |
| `baseStats` | `Record<StatKey, number>` | All stats present; each ≥ 0 |

### EquipmentState (Zustand)

| Field | Type | Rules |
|-------|------|-------|
| `equipped` | `Record<SlotType, ItemId \| null>` | Slot holds zero or one item ID; item's `slotType` must equal the slot key (invariant I2) |
| `bag` | `(ItemId \| null)[]` | Fixed length = `BAG_CAPACITY` (v1: 24); each cell holds ≤ 1 item ID |
| `muted` | `boolean` | Governs all sound playback (FR-010) |
| `activeDrag` | `{ itemId: ItemId; origin: DragOrigin } \| null` | Transient; set on drag start, cleared on any drag end |

`DragOrigin = { kind: 'bag'; index: number } | { kind: 'slot'; slot: SlotType }`

### DropOutcome (derived, transient)

Resolved once per drag-end; the single trigger for both the state transition and the
sound effect (exactly-once guarantee, FR-009/FR-011/SC-004):

```
| { type: 'equip';    itemId; slot }                 → sound: equip
| { type: 'swap';     itemId; slot; replacedItemId } → sound: equip
| { type: 'unequip';  itemId; toBagIndex }           → sound: unequip
| { type: 'moveInBag'; itemId; toBagIndex }          → sound: none
| { type: 'invalid' }                                → sound: invalid
| { type: 'cancelled' }                              → sound: invalid
```

### EffectiveStats (derived)

```
effective[stat] = max(0, baseStats[stat] + Σ modifiers[stat] over equipped items)
```

- Pure function `computeEffectiveStats(base, equippedItems)` in
  `features/character/stats.ts`; never persisted (FR-006, FR-011).
- Clamped at 0 per spec edge case (negative modifiers).
- Stat panel also derives `delta[stat] = effective − base` for the base-vs-equipment
  breakdown (FR-014).

### SoundEffect (registry)

| Field | Type | Rules |
|-------|------|-------|
| `id` | `'pickup' \| 'equip' \| 'unequip' \| 'invalid'` | One per main interaction (FR-009) |
| `src` | `string` | Local asset path (CC0/public-domain) |

## Invariants

- **I1 — Single location**: every `ItemId` from the catalog appears in exactly one place:
  one `bag` cell, one `equipped` slot, or nowhere (not owned). Never duplicated.
- **I2 — Slot compatibility**: `equipped[slot] = id` implies
  `catalog[id].slotType === slot`.
- **I3 — Bounded bag**: `bag.length === BAG_CAPACITY` always; unequip into a full bag is
  rejected with user feedback (US3-AS3).
- **I4 — Derived stats only**: effective stats are computed, never stored; therefore they
  cannot drift under rapid interactions (SC-006).
- **I5 — No entity copies in Zustand**: the store contains only IDs and primitives;
  contract test asserts no `Item`-shaped objects in store state.

## State transitions (store actions)

| Action | Precondition | Effect |
|--------|--------------|--------|
| `startDrag(itemId, origin)` | Item exists at origin | `activeDrag` set |
| `equip(itemId, slot)` | I2 holds; slot empty; item in bag | bag cell → null; `equipped[slot]` → itemId |
| `swap(itemId, slot)` | I2 holds; slot occupied; item in bag | incoming equips; previous item → incoming item's bag cell (FR-008) |
| `unequip(slot, toBagIndex?)` | Slot occupied; bag has a free cell | `equipped[slot]` → null; item → first free (or targeted) bag cell |
| `moveInBag(itemId, toIndex)` | Target cell empty | Item moves cells (reorder) |
| `cancelDrag()` | — | `activeDrag` → null; no ownership change (FR-012) |
| `toggleMute()` | — | `muted` flips (FR-010) |

All transitions are pure `(state, args) → state` functions, unit-tested directly.
