import { beforeEach, describe, expect, it } from 'vitest';
import {
  registerItemSlotTypes,
  useInventoryStore,
} from '../../src/store/useInventoryStore';
import type { ItemId } from '../../src/types/domain';
import { BAG_CAPACITY, toItemId } from '../../src/types/domain';

const helmA = toItemId('helm-a');
const helmB = toItemId('helm-b');
const sword = toItemId('sword-a');

function fillBag(): ItemId[] {
  return Array.from({ length: BAG_CAPACITY }, (_, i) => toItemId(`filler-${String(i)}`));
}

describe('store swap transition (US3 / FR-008)', () => {
  beforeEach(() => {
    registerItemSlotTypes({ [helmA]: 'head', [helmB]: 'head', [sword]: 'weapon' });
    useInventoryStore.getState().reset();
    useInventoryStore.getState().seedBag([helmA, helmB, sword]);
  });

  it('places the displaced item into the incoming item bag cell', () => {
    useInventoryStore.getState().equip(helmA, 'head');
    useInventoryStore.getState().swap(helmB, 'head'); // helmB was in cell 1
    const s = useInventoryStore.getState();
    expect(s.equipped.head).toBe(helmB);
    expect(s.bag[1]).toBe(helmA);
    expect(s.bag[0]).toBeNull();
  });

  it('no-ops on slot-type mismatch', () => {
    useInventoryStore.getState().equip(helmA, 'head');
    useInventoryStore.getState().swap(sword, 'head');
    const s = useInventoryStore.getState();
    expect(s.equipped.head).toBe(helmA);
    expect(s.bag[2]).toBe(sword);
  });

  it('no-ops when the slot is empty (equip is the right action)', () => {
    useInventoryStore.getState().swap(helmA, 'head');
    const s = useInventoryStore.getState();
    expect(s.equipped.head).toBeNull();
    expect(s.bag[0]).toBe(helmA);
  });
});

describe('store unequip transition (US3 / FR-007)', () => {
  beforeEach(() => {
    registerItemSlotTypes({ [helmA]: 'head' });
    useInventoryStore.getState().reset();
    useInventoryStore.getState().seedBag([helmA]);
    useInventoryStore.getState().equip(helmA, 'head');
  });

  it('returns the item to the targeted bag cell', () => {
    const result = useInventoryStore.getState().unequip('head', 7);
    expect(result).toBe('ok');
    const s = useInventoryStore.getState();
    expect(s.equipped.head).toBeNull();
    expect(s.bag[7]).toBe(helmA);
  });

  it('falls back to the first free cell when no target given', () => {
    const result = useInventoryStore.getState().unequip('head');
    expect(result).toBe('ok');
    expect(useInventoryStore.getState().bag[0]).toBe(helmA);
  });

  it("returns 'bag-full' and keeps the item equipped when the bag has no free cell", () => {
    const filler = fillBag();
    registerItemSlotTypes({
      [helmA]: 'head',
      ...Object.fromEntries(filler.map((id) => [id, 'accessory'])),
    });
    useInventoryStore.setState({ bag: filler });
    const result = useInventoryStore.getState().unequip('head');
    expect(result).toBe('bag-full');
    const s = useInventoryStore.getState();
    expect(s.equipped.head).toBe(helmA);
    expect(s.bag.every((cell) => cell !== null)).toBe(true);
  });

  it("returns 'no-op' for an empty slot", () => {
    useInventoryStore.getState().unequip('head');
    expect(useInventoryStore.getState().unequip('head')).toBe('no-op');
  });
});

describe('store moveInBag transition (US3)', () => {
  beforeEach(() => {
    registerItemSlotTypes({ [helmA]: 'head', [sword]: 'weapon' });
    useInventoryStore.getState().reset();
    useInventoryStore.getState().seedBag([helmA, sword]);
  });

  it('moves an item to an empty cell', () => {
    useInventoryStore.getState().moveInBag(helmA, 10);
    const s = useInventoryStore.getState();
    expect(s.bag[0]).toBeNull();
    expect(s.bag[10]).toBe(helmA);
  });

  it('no-ops when the target cell is occupied', () => {
    useInventoryStore.getState().moveInBag(helmA, 1); // sword lives there
    const s = useInventoryStore.getState();
    expect(s.bag[0]).toBe(helmA);
    expect(s.bag[1]).toBe(sword);
  });

  it('no-ops for out-of-range targets', () => {
    useInventoryStore.getState().moveInBag(helmA, BAG_CAPACITY);
    expect(useInventoryStore.getState().bag[0]).toBe(helmA);
  });
});
