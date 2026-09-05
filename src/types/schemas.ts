/**
 * Zod schemas mirroring the contracts in
 * specs/001-game-inventory-system/contracts/. Used by contract tests and as
 * the validation boundary between mock data and React Query consumers.
 */
import { z } from 'zod';
import { SLOT_TYPES, STAT_KEYS } from './domain';

export const SlotTypeSchema = z.enum(SLOT_TYPES);

export const StatKeySchema = z.enum(STAT_KEYS);

export const ItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  icon: z.string().min(1),
  slotType: SlotTypeSchema,
  // Zod v4: partialRecord — modifiers must be non-negative integers per stat.
  modifiers: z.partialRecord(StatKeySchema, z.number().int().nonnegative()).default({}),
});

export const ItemCatalogSchema = z
  .array(ItemSchema)
  .min(10)
  .refine(
    (items) => new Set(items.map((i) => i.id)).size === items.length,
    'item ids must be unique',
  )
  .refine(
    (items) => SlotTypeSchema.options.every((s) => items.some((i) => i.slotType === s)),
    'catalog must cover every slot type',
  );

export const CharacterAppearanceSchema = z.object({
  seed: z.number().int(),
  parts: z.record(z.string(), z.string()),
});

export const CharacterSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  appearance: CharacterAppearanceSchema,
  baseStats: z
    .record(StatKeySchema, z.number().int().nonnegative())
    .refine(
      (s) => StatKeySchema.options.every((k) => k in s),
      'all stat keys must be present',
    ),
});

export const InventoryStoreStateSchema = z.object({
  equipped: z
    .record(SlotTypeSchema, z.string().nullable())
    .refine(
      (e) => SlotTypeSchema.options.every((k) => k in e),
      'all slots must be present',
    ),
  unequipped: z.array(z.string()),
  muted: z.boolean(),
  feedback: z.string().nullable(),
});
