import { describe, expect, it } from 'vitest';
import {
  ItemCatalogSchema,
  SlotTypeSchema,
  StatKeySchema,
} from '../../src/types/schemas';
import { items } from '../../src/mocks/items';

describe('item catalog contract', () => {
  it('parses with ItemCatalogSchema (≥10 items, unique ids, every slot type covered)', () => {
    const result = ItemCatalogSchema.safeParse(items);
    expect(result.success).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(10);
  });

  it('covers all 7 slot types (FR-013)', () => {
    for (const slot of SlotTypeSchema.options) {
      expect(items.some((i) => i.slotType === slot)).toBe(true);
    }
  });

  it('uses only known stat keys with integer values in modifiers', () => {
    for (const item of items) {
      for (const [key, value] of Object.entries(item.modifiers)) {
        expect(StatKeySchema.options).toContain(key);
        expect(Number.isInteger(value)).toBe(true);
      }
    }
  });

  it('ensures no items in the catalog have negative modifiers', () => {
    for (const item of items) {
      for (const value of Object.values(item.modifiers)) {
        expect(value).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
