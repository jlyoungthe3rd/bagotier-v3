import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import type { StatKey } from '../../types/domain';
import { STAT_KEYS } from '../../types/domain';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useCharacterQuery } from './useCharacterQuery';
import { computeDeltas, computeEffectiveStats } from './stats';
import { fetchItems } from '../../mocks/api';
import { queryKeys } from '../../lib/queryKeys';

const STAT_LABELS: Readonly<Record<StatKey, string>> = {
  hp: 'HP',
  mp: 'MP',
  def: 'DEF',
  str: 'STR',
  agi: 'AGI',
  int: 'INT',
};

/**
 * Attributes Panel: Displays base + equipped modifiers.
 * Rendered in a single row under the paper doll, using a premium frosted-glass container.
 * Only the final computed value is displayed, color-coded for buffs/debuffs.
 */
export function StatPanel() {
  const { data: charData } = useCharacterQuery();
  const equipped = useInventoryStore((s) => s.equipped);

  const { data: equippedItems } = useQuery({
    queryKey: queryKeys.items,
    queryFn: fetchItems,
    select: (items) =>
      Object.values(equipped)
        .filter((id): id is NonNullable<typeof id> => id !== null)
        .map((id) => items.find((i) => i.id === id))
        .filter((i) => i !== undefined),
  });

  const prevEffectiveRef = useRef<Record<StatKey, number> | null>(null);

  const effective = charData
    ? computeEffectiveStats(charData.baseStats, equippedItems ?? [])
    : null;
  const deltas = charData && effective ? computeDeltas(charData.baseStats, effective) : null;

  const prevEffective = prevEffectiveRef.current;

  useEffect(() => {
    if (effective) {
      prevEffectiveRef.current = effective;
    }
  }, [effective]);

  if (charData === undefined || effective === null || deltas === null) return null;

  return (
    <section
      aria-label="Character stats"
      data-testid="stat-panel"
      className="w-full rounded-lg border border-white/10 bg-surface-raised/30 p-3.5 backdrop-blur-md shadow-lg sm:p-4"
    >
      <h2 className="mb-3 font-display text-[9px] font-bold uppercase tracking-[0.2em] text-gold/80">
        Attributes
      </h2>
      <div className="grid grid-cols-3 gap-y-3.5 gap-x-2 sm:grid-cols-6 sm:gap-x-4">
        {STAT_KEYS.map((key) => {
          const delta = deltas[key];
          const kind = delta > 0 ? 'buff' : delta < 0 ? 'debuff' : 'none';

          const currentVal = effective[key];
          const prevVal = prevEffective ? prevEffective[key] : currentVal;

          let initialColor = '#ffffff';
          if (currentVal > prevVal) {
            initialColor = '#6ec87c'; // buff green flash
          } else if (currentVal < prevVal) {
            initialColor = '#e06060'; // debuff red flash
          }

          return (
            <div
              key={key}
              data-testid={`stat-${key}`}
              data-delta={kind}
              className="flex flex-col items-center justify-center rounded bg-surface/20 p-2 border border-white/5 sm:p-2.5"
            >
              <span className="text-[9px] font-semibold uppercase tracking-wider text-ink-muted/80">
                {STAT_LABELS[key]}
              </span>
              <motion.span
                key={`${key}-${String(effective[key])}`}
                initial={{ scale: 1.75, color: initialColor }}
                animate={{ scale: [1.25, 1.0], color: [initialColor, initialColor, '#ffffff'] }}
                transition={{ duration: 0.8, times: [0, 0.4, 1.0], ease: 'easeOut' }}
                className="mt-0.5 text-sm font-semibold tracking-tight text-white"
              >
                {effective[key]}
              </motion.span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
