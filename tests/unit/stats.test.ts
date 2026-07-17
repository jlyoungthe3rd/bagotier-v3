import { describe, expect, it } from 'vitest';
import { computeDeltas, computeEffectiveStats } from '../../src/features/character/stats';
import type { Item, StatKey } from '../../src/types/domain';
import { toItemId } from '../../src/types/domain';

const base: Record<StatKey, number> = {
  hp: 50,
  mp: 30,
  def: 10,
  str: 8,
  agi: 10,
  int: 10,
};

function makeItem(modifiers: Item['modifiers']): Item {
  return {
    id: toItemId(`test-${JSON.stringify(modifiers)}`),
    name: 'Test Item',
    icon: '🧪',
    slotType: 'head',
    modifiers,
  };
}

describe('computeEffectiveStats (US2 / FR-006)', () => {
  it('returns base stats when nothing is equipped', () => {
    expect(computeEffectiveStats(base, [])).toEqual(base);
  });

  it('adds a single item modifier to the base stat', () => {
    const effective = computeEffectiveStats(base, [makeItem({ def: 5 })]);
    expect(effective.def).toBe(15);
    expect(effective.hp).toBe(50);
  });

  it('sums modifiers across multiple equipped items', () => {
    const effective = computeEffectiveStats(base, [
      makeItem({ def: 5, hp: 4 }),
      makeItem({ def: 3, str: 2 }),
    ]);
    expect(effective).toEqual({ hp: 54, mp: 30, def: 18, str: 10, agi: 10, int: 10 });
  });

  it('retains 0-clamping safety guard in computeEffectiveStats', () => {
    const effective = computeEffectiveStats(base, [makeItem({ def: 0, mp: 5 })]);
    expect(effective.def).toBe(10);
    expect(effective.mp).toBe(35);
  });

  it('ignores absent modifiers', () => {
    const effective = computeEffectiveStats(base, [makeItem({})]);
    expect(effective).toEqual(base);
  });
});

describe('computeDeltas (FR-014)', () => {
  it('reports effective minus base per stat', () => {
    const effective = { hp: 54, mp: 35, def: 10, str: 8, agi: 10, int: 10 };
    expect(computeDeltas(base, effective)).toEqual({
      hp: 4,
      mp: 5,
      def: 0,
      str: 0,
      agi: 0,
      int: 0,
    });
  });
});
