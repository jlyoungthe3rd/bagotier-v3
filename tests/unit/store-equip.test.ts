import { beforeEach, describe, expect, it } from 'vitest';
import {
  registerItemSlotTypes,
  useInventoryStore,
} from '../../src/store/useInventoryStore';
import { toItemId } from '../../src/types/domain';

const helm = toItemId('iron-helm');
const sword = toItemId('bronze-sword');

describe('store equip transition (US1)', () => {
  beforeEach(() => {
    registerItemSlotTypes({ [helm]: 'head', [sword]: 'weapon' });
    useInventoryStore.getState().reset();
    useInventoryStore.getState().seedUnequipped([helm, sword]);
  });

  it('moves the item ID from unequipped into the matching empty slot', () => {
    useInventoryStore.getState().equip(helm, 'head');
    const s = useInventoryStore.getState();
    expect(s.equipped.head).toBe(helm);
    expect(s.unequipped.has(helm)).toBe(false);
  });

  it('no-ops when the slot type does not match (FR-003)', () => {
    useInventoryStore.getState().equip(helm, 'legs');
    const s = useInventoryStore.getState();
    expect(s.equipped.legs).toBeNull();
    expect(s.unequipped.has(helm)).toBe(true);
  });

  it('swaps and displaces previous item back to unequipped when slot is occupied', () => {
    useInventoryStore.getState().equip(helm, 'head');
    const secondHelm = toItemId('wizard-hat');
    registerItemSlotTypes({
      [helm]: 'head',
      [sword]: 'weapon',
      [secondHelm]: 'head',
    });
    useInventoryStore.getState().seedUnequipped([sword, secondHelm]);
    // Manually ensure helm is equipped and secondHelm is unequipped
    useInventoryStore.setState((s) => ({
      ...s,
      equipped: { ...s.equipped, head: helm },
      unequipped: new Set([sword, secondHelm]),
    }));

    useInventoryStore.getState().equip(secondHelm, 'head');
    const s = useInventoryStore.getState();
    expect(s.equipped.head).toBe(secondHelm);
    expect(s.unequipped.has(secondHelm)).toBe(false);
    expect(s.unequipped.has(helm)).toBe(true);
  });

  it('no-ops when the item is not in unequipped', () => {
    const ghost = toItemId('ghost-item');
    registerItemSlotTypes({ [ghost]: 'head' });
    useInventoryStore.getState().equip(ghost, 'head');
    expect(useInventoryStore.getState().equipped.head).toBeNull();
  });
});
