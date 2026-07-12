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
    useInventoryStore.getState().seedBag([helm, sword]);
  });

  it('moves the item ID from its bag cell into the matching empty slot', () => {
    useInventoryStore.getState().equip(helm, 'head');
    const s = useInventoryStore.getState();
    expect(s.equipped.head).toBe(helm);
    expect(s.bag[0]).toBeNull();
    expect(s.bag).toHaveLength(24);
  });

  it('no-ops when the slot type does not match (FR-003)', () => {
    useInventoryStore.getState().equip(helm, 'legs');
    const s = useInventoryStore.getState();
    expect(s.equipped.legs).toBeNull();
    expect(s.bag[0]).toBe(helm);
  });

  it('no-ops when the slot is already occupied', () => {
    useInventoryStore.getState().equip(helm, 'head');
    const secondHelm = toItemId('wizard-hat');
    registerItemSlotTypes({
      [helm]: 'head',
      [sword]: 'weapon',
      [secondHelm]: 'head',
    });
    useInventoryStore.setState((s) => {
      const bag = s.bag.slice();
      bag[5] = secondHelm;
      return { bag };
    });
    useInventoryStore.getState().equip(secondHelm, 'head');
    const s = useInventoryStore.getState();
    expect(s.equipped.head).toBe(helm);
    expect(s.bag[5]).toBe(secondHelm);
  });

  it('no-ops when the item is not in the bag', () => {
    const ghost = toItemId('ghost-item');
    registerItemSlotTypes({ [ghost]: 'head' });
    useInventoryStore.getState().equip(ghost, 'head');
    expect(useInventoryStore.getState().equipped.head).toBeNull();
  });

  it('clears activeDrag after an equip', () => {
    useInventoryStore.getState().startDrag(helm, { kind: 'bag', index: 0 });
    useInventoryStore.getState().equip(helm, 'head');
    expect(useInventoryStore.getState().activeDrag).toBeNull();
  });
});

describe('store cancelDrag transition (US1 / FR-012)', () => {
  beforeEach(() => {
    registerItemSlotTypes({ [helm]: 'head' });
    useInventoryStore.getState().reset();
    useInventoryStore.getState().seedBag([helm]);
  });

  it('clears activeDrag without changing item ownership', () => {
    useInventoryStore.getState().startDrag(helm, { kind: 'bag', index: 0 });
    expect(useInventoryStore.getState().activeDrag).toEqual({
      itemId: helm,
      origin: { kind: 'bag', index: 0 },
    });
    useInventoryStore.getState().cancelDrag();
    const s = useInventoryStore.getState();
    expect(s.activeDrag).toBeNull();
    expect(s.bag[0]).toBe(helm);
    expect(Object.values(s.equipped).every((v) => v === null)).toBe(true);
  });
});
