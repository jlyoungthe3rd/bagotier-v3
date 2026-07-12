import type { Item, StatKey } from '../../types/domain';
import { STAT_KEYS } from '../../types/domain';

/**
 * Computes effective stats: base + summed equipped modifiers, clamped at 0
 * (FR-006, data-model.md EffectiveStats). Pure — derived, never stored.
 */
export function computeEffectiveStats(
  base: Readonly<Record<StatKey, number>>,
  equippedItems: readonly Item[],
): Record<StatKey, number> {
  const effective = { ...base };
  for (const key of STAT_KEYS) {
    let total = base[key];
    for (const item of equippedItems) {
      total += item.modifiers[key] ?? 0;
    }
    effective[key] = Math.max(0, total);
  }
  return effective;
}

/** Per-stat difference between effective and base values (FR-014). */
export function computeDeltas(
  base: Readonly<Record<StatKey, number>>,
  effective: Readonly<Record<StatKey, number>>,
): Record<StatKey, number> {
  const deltas = { ...base };
  for (const key of STAT_KEYS) {
    deltas[key] = effective[key] - base[key];
  }
  return deltas;
}
