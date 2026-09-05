import { beforeEach, describe, expect, it } from 'vitest';
import {
  registerItemSlotTypes,
  useInventoryStore,
} from '../../src/store/useInventoryStore';
import { toItemId } from '../../src/types/domain';

const helmA = toItemId('helm-a');
const helmB = toItemId('helm-b');
const sword = toItemId('sword-a');

describe('store unequip transition (US3 / FR-007)', () => {
  beforeEach(() => {
    registerItemSlotTypes({ [helmA]: 'head', [helmB]: 'head', [sword]: 'weapon' });
    useInventoryStore.getState().reset();
    useInventoryStore.getState().seedUnequipped([helmA, helmB, sword]);
    useInventoryStore.getState().equip(helmA, 'head');
  });

  it('returns the item to the unequipped set', () => {
    useInventoryStore.getState().unequip('head');
    const s = useInventoryStore.getState();
    expect(s.equipped.head).toBeNull();
    expect(s.unequipped.has(helmA)).toBe(true);
  });

  it('no-ops for an empty slot', () => {
    useInventoryStore.getState().unequip('weapon');
    const s = useInventoryStore.getState();
    expect(s.equipped.weapon).toBeNull();
  });
});

describe('store equip replacement (US3 / FR-008)', () => {
  beforeEach(() => {
    registerItemSlotTypes({ [helmA]: 'head', [helmB]: 'head', [sword]: 'weapon' });
    useInventoryStore.getState().reset();
    useInventoryStore.getState().seedUnequipped([helmA, helmB, sword]);
  });

  it('equipping another item into an occupied slot swaps displaced item to unequipped', () => {
    useInventoryStore.getState().equip(helmA, 'head');
    useInventoryStore.getState().equip(helmB, 'head');
    const s = useInventoryStore.getState();
    expect(s.equipped.head).toBe(helmB);
    expect(s.unequipped.has(helmA)).toBe(true);
    expect(s.unequipped.has(helmB)).toBe(false);
  });
});
