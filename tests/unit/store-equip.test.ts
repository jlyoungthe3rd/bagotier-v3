import { beforeEach, describe, expect, it } from 'vitest';
import { useInventoryStore } from '../../src/store/useInventoryStore';
import { toItemId } from '../../src/types/domain';

const helm = toItemId('iron-helm');
const sword = toItemId('bronze-sword');

describe('store equip transition (US1)', () => {
  beforeEach(() => {
    useInventoryStore.getState().reset();
    useInventoryStore.getState().seedUnequipped([helm, sword]);
  });

  it('moves the item ID from unequipped into the matching empty slot', () => {
    useInventoryStore.getState().equip(helm, 'head');
    const s = useInventoryStore.getState();
    expect(s.equipped.head).toBe(helm);
    expect(s.unequipped.has(helm)).toBe(false);
  });

  it('equips directly to the requested slot without needing any registry', () => {
    const freshItem = toItemId('fresh-unregistered-item');
    useInventoryStore.getState().seedUnequipped([freshItem]);
    useInventoryStore.getState().equip(freshItem, 'feet');
    const s = useInventoryStore.getState();
    expect(s.equipped.feet).toBe(freshItem);
    expect(s.unequipped.has(freshItem)).toBe(false);
  });

  it('swaps and displaces previous item back to unequipped when slot is occupied', () => {
    useInventoryStore.getState().equip(helm, 'head');
    const secondHelm = toItemId('wizard-hat');
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
    useInventoryStore.getState().equip(ghost, 'head');
    expect(useInventoryStore.getState().equipped.head).toBeNull();
  });
});
