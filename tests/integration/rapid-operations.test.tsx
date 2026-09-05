import { beforeEach, describe, expect, it } from 'vitest';
import {
  registerItemSlotTypes,
  useInventoryStore,
} from '../../src/store/useInventoryStore';
import { computeEffectiveStats } from '../../src/features/character/stats';
import { items } from '../../src/mocks/items';
import { character } from '../../src/mocks/character';
import { STAT_KEYS, toItemId } from '../../src/types/domain';
import type { Item, ItemId, SlotType, StatKey } from '../../src/types/domain';

const itemById = new Map<ItemId, Item>(items.map((i) => [i.id, i]));

function resolveEquipped(
  equipped: Readonly<Record<SlotType, ItemId | null>>,
): readonly Item[] {
  return Object.values(equipped)
    .filter((id): id is ItemId => id !== null)
    .map((id) => {
      const item = itemById.get(id);
      if (item === undefined) throw new Error(`unknown item ${id}`);
      return item;
    });
}

/**
 * T048 — 20+ rapid successive operations leave the model consistent:
 * no lost/duplicated items and no double-applied stat modifiers (SC-007).
 */
describe('rapid successive operations (Polish)', () => {
  beforeEach(() => {
    useInventoryStore.getState().reset();
    registerItemSlotTypes(Object.fromEntries(items.map((i) => [i.id, i.slotType])));
    useInventoryStore.getState().seedUnequipped(items.map((i) => i.id));
  });

  it('keeps unequipped + slots consistent through 20+ mixed operations', () => {
    const s = () => useInventoryStore.getState();
    const ops: (() => void)[] = [
      () => s().equip(toItemId('iron-helm'), 'head'),
      () => s().equip(toItemId('steel-cuirass'), 'body'),
      () => s().equip(toItemId('cursed-gauntlets'), 'hands'),
      () => s().equip(toItemId('oak-staff'), 'weapon'),
      () => s().equip(toItemId('wizard-hat'), 'head'),
      () => s().equip(toItemId('bronze-sword'), 'weapon'),
      () => {
        s().unequip('head');
      },
      () => s().equip(toItemId('iron-helm'), 'head'),
      () => s().equip(toItemId('plated-greaves'), 'legs'),
      () => s().equip(toItemId('iron-sabatons'), 'feet'),
      () => s().equip(toItemId('lucky-charm'), 'accessory'),
      () => s().equip(toItemId('wizard-hat'), 'head'),
      () => {
        s().unequip('weapon');
      },
      () => s().equip(toItemId('oak-staff'), 'weapon'),
      () => s().equip(toItemId('bronze-sword'), 'weapon'),
      () => {
        s().unequip('hands');
      },
      () => s().equip(toItemId('cursed-gauntlets'), 'hands'),
      () => s().equip(toItemId('iron-helm'), 'head'),
      () => {
        s().unequip('accessory');
      },
      () => s().equip(toItemId('lucky-charm'), 'accessory'),
      () => s().equip(toItemId('silk-robe'), 'body'),
      () => s().equip(toItemId('travel-boots'), 'feet'),
    ];
    for (const op of ops) op();

    const { unequipped, equipped } = s();
    const unequippedIds = Array.from(unequipped);
    const equippedIds = Object.values(equipped).filter((id): id is ItemId => id !== null);
    const all = [...unequippedIds, ...equippedIds];
    // No item lost or duplicated.
    expect(all).toHaveLength(items.length);
    expect(new Set(all).size).toBe(items.length);

    // Stats reflect the final equipment exactly once per modifier.
    const effective = computeEffectiveStats(
      character.baseStats,
      resolveEquipped(equipped),
    );
    const expected: Record<StatKey, number> = { ...character.baseStats };
    for (const item of resolveEquipped(equipped)) {
      for (const key of STAT_KEYS) {
        expected[key] += item.modifiers[key] ?? 0;
      }
    }
    for (const key of STAT_KEYS) {
      expected[key] = Math.max(0, expected[key]);
      expect(effective[key]).toBe(expected[key]);
    }
  });
});
