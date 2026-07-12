# Contract: Zustand Store & Query-Key Boundary

**Feature**: `001-game-inventory-system`

Defines the shape and rules of the Zustand session store and its boundary with the
React Query cache. Core rule (user-mandated): **the store references React Query data by
ID only and never copies entities.**

## Store state contract

```ts
export const DragOriginSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('bag'), index: z.number().int().nonnegative() }),
  z.object({ kind: z.literal('slot'), slot: SlotTypeSchema }),
]);

export const InventoryStoreStateSchema = z.object({
  equipped: z.record(SlotTypeSchema, z.string().nullable())
    .refine(e => SlotTypeSchema.options.every(k => k in e), 'all slots present'),
  bag: z.array(z.string().nullable()).length(24),   // BAG_CAPACITY
  muted: z.boolean(),
  activeDrag: z.object({ itemId: z.string(), origin: DragOriginSchema }).nullable(),
});
```

## Actions contract

| Action | Signature | Result / rejection |
|--------|-----------|--------------------|
| `startDrag` | `(itemId: ItemId, origin: DragOrigin) => void` | Sets `activeDrag` |
| `equip` | `(itemId: ItemId, slot: SlotType) => void` | Moves ID bag→slot; no-op if slot type mismatch |
| `swap` | `(itemId: ItemId, slot: SlotType) => void` | Incoming equips; displaced ID → incoming's bag cell |
| `unequip` | `(slot: SlotType, toBagIndex?: number) => Result` | Rejects with `'bag-full'` when no free cell (US3-AS3) |
| `moveInBag` | `(itemId: ItemId, toIndex: number) => void` | Reorders within bag |
| `cancelDrag` | `() => void` | Clears `activeDrag` only |
| `toggleMute` | `() => void` | Flips `muted` |

## Boundary rules (contract-tested)

1. **No entity copies**: no value in store state is an object with `name`/`slotType`/
   `modifiers` keys — only string IDs, numbers, booleans, and the `activeDrag`/origin
   records above (invariant I5).
2. **Referential resolution**: components resolve IDs via
   `useItem(id)` → `useQuery(['items'], { select: items => items.find(...) })`
   (or an ID-indexed `select`); never via store lookups.
3. **Single location** (invariant I1): after any sequence of actions, each ID appears at
   most once across `equipped` + `bag`.
4. **Query keys** are produced only by the `queryKeys` factory:
   `queryKeys.items = ['items'] as const`, `queryKeys.character = ['character'] as const`.

## Contract tests (tests/contract/store.contract.test.ts)

1. Initial store state parses with `InventoryStoreStateSchema`.
2. Property-style test: random sequences of valid actions preserve invariants I1–I3
   and keep state schema-valid (backs SC-006).
3. Store state after seeding contains no `Item`-shaped objects (rule 1).
