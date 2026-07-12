# Contract: Item & Item Catalog

**Feature**: `001-game-inventory-system` | Consumed by: React Query `['items']`

This is a client-only app; "contracts" define the schemas at the boundary between the
mock data layer (`src/mocks/`) and consumers (React Query hooks). Enforced with Zod at
test time (contract tests) and as the source of inferred TypeScript types.

## Zod schema

```ts
import { z } from 'zod';

export const SlotTypeSchema = z.enum([
  'head', 'body', 'legs', 'hands', 'feet', 'weapon', 'accessory',
]);

export const StatKeySchema = z.enum(['hp', 'mp', 'def', 'str']);

export const ItemSchema = z.object({
  id: z.string().min(1),                 // branded as ItemId in domain types
  name: z.string().min(1),
  icon: z.string().min(1),
  slotType: SlotTypeSchema,
  modifiers: z.record(StatKeySchema, z.number().int()).default({}),
});

export const ItemCatalogSchema = z
  .array(ItemSchema)
  .min(10)                                                        // FR-013
  .refine(items => new Set(items.map(i => i.id)).size === items.length,
    'item ids must be unique')
  .refine(items =>
    SlotTypeSchema.options.every(s => items.some(i => i.slotType === s)),
    'catalog must cover every slot type');                        // FR-013
```

## Fetcher contract

```ts
// mocks/api.ts
fetchItems(): Promise<Item[]>   // resolves ItemCatalogSchema-valid data; simulated ~150ms latency
```

- Query key: `queryKeys.items` → `['items']`
- Query options: `staleTime: Infinity`, `retry: 1`
- Error mode: fetcher may reject to exercise the error state (Constitution III); UI must
  render a designed error state with retry.

## Contract tests (tests/contract/items.contract.test.ts)

1. `mocks/items.ts` parses with `ItemCatalogSchema` (≥10 items, all slot types, unique ids).
2. Every item's `modifiers` uses only known `StatKey`s and integer values.
3. At least one item has a negative modifier (exercises the clamping edge case).
