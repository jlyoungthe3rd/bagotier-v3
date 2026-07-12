# Contract: Character

**Feature**: `001-game-inventory-system` | Consumed by: React Query `['character']`

## Zod schema

```ts
import { z } from 'zod';
import { StatKeySchema } from './item-schema';

export const CharacterAppearanceSchema = z.object({
  seed: z.number().int(),
  parts: z.record(z.string(), z.string()),   // e.g., { hair: 'hair-03', face: 'face-01' }
});

export const CharacterSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  appearance: CharacterAppearanceSchema,
  baseStats: z.record(StatKeySchema, z.number().int().nonnegative())
    .refine(s => StatKeySchema.options.every(k => k in s),
      'all stat keys must be present'),      // FR-006 requires all stats displayable
});
```

## Fetcher contract

```ts
// mocks/api.ts
fetchCharacter(): Promise<Character>  // generated at module load (deterministic per seed); ~150ms simulated latency
```

- Query key: `queryKeys.character` → `['character']`
- Query options: `staleTime: Infinity`
- Loading state: character area renders a skeleton until resolved (Constitution III).

## Contract tests (tests/contract/character.contract.test.ts)

1. `mocks/character.ts` output parses with `CharacterSchema`.
2. `baseStats` contains every `StatKey` with a value ≥ 0.
