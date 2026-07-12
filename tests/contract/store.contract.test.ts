import { beforeEach, describe, expect, it } from 'vitest';
import { InventoryStoreStateSchema } from '../../src/types/schemas';
import {
  registerItemSlotTypes,
  useInventoryStore,
} from '../../src/store/useInventoryStore';
import type { ItemId, SlotType } from '../../src/types/domain';
import { BAG_CAPACITY, SLOT_TYPES, toItemId } from '../../src/types/domain';

/** Deterministic PRNG so the property-style test is reproducible. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const catalog: Record<string, SlotType> = {};
const ids: ItemId[] = [];
for (let i = 0; i < 14; i++) {
  const id = toItemId(`fixture-${String(i)}`);
  const slot = SLOT_TYPES[i % SLOT_TYPES.length];
  if (slot === undefined) throw new Error('unreachable');
  catalog[id] = slot;
  ids.push(id);
}

function pickState() {
  const s = useInventoryStore.getState();
  return {
    equipped: s.equipped,
    bag: s.bag,
    muted: s.muted,
    activeDrag: s.activeDrag,
  };
}

function assertInvariants(): void {
  const s = useInventoryStore.getState();
  // I3 — bounded bag
  expect(s.bag).toHaveLength(BAG_CAPACITY);
  // I1 — single location: each id appears at most once across equipped + bag
  const seen = [
    ...Object.values(s.equipped).filter((v): v is ItemId => v !== null),
    ...s.bag.filter((v): v is ItemId => v !== null),
  ];
  expect(new Set(seen).size).toBe(seen.length);
  // I2 — slot compatibility
  for (const slot of SLOT_TYPES) {
    const id = s.equipped[slot];
    if (id !== null) expect(catalog[id]).toBe(slot);
  }
  // Schema-valid throughout
  expect(InventoryStoreStateSchema.safeParse(pickState()).success).toBe(true);
}

describe('inventory store contract', () => {
  beforeEach(() => {
    registerItemSlotTypes(catalog);
    useInventoryStore.getState().reset();
  });

  it('initial state parses with InventoryStoreStateSchema', () => {
    expect(InventoryStoreStateSchema.safeParse(pickState()).success).toBe(true);
  });

  it('preserves invariants I1–I3 under random valid action sequences (SC-006)', () => {
    const rand = mulberry32(0xbadc0de);
    useInventoryStore.getState().seedBag(ids);
    assertInvariants();

    for (let step = 0; step < 300; step++) {
      const s = useInventoryStore.getState();
      const roll = rand();
      const itemId = ids[Math.floor(rand() * ids.length)]!;
      const slot = SLOT_TYPES[Math.floor(rand() * SLOT_TYPES.length)]!;
      if (roll < 0.3) {
        s.equip(itemId, slot);
      } else if (roll < 0.5) {
        s.swap(itemId, slot);
      } else if (roll < 0.7) {
        s.unequip(slot);
      } else if (roll < 0.85) {
        s.moveInBag(itemId, Math.floor(rand() * BAG_CAPACITY));
      } else if (roll < 0.95) {
        s.startDrag(itemId, { kind: 'bag', index: 0 });
        s.cancelDrag();
      } else {
        s.toggleMute();
      }
      assertInvariants();
    }
  });

  it('contains no Item-shaped entity copies in state (invariant I5)', () => {
    useInventoryStore.getState().seedBag(ids);
    const state = pickState();
    const stack: unknown[] = [state];
    while (stack.length > 0) {
      const value = stack.pop();
      if (value !== null && typeof value === 'object') {
        const record = value as Record<string, unknown>;
        expect('name' in record && 'slotType' in record && 'modifiers' in record).toBe(
          false,
        );
        stack.push(...Object.values(record));
      }
    }
  });
});
