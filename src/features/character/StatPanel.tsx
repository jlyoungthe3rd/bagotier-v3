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

// Design token color constants matching tailwind.config.ts
const COLOR_BUFF = '#6ec87c';
const COLOR_DEBUFF = '#e06060';
const COLOR_NEUTRAL = '#ffffff';

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

  const prevEffective = prevEffectiveRef.current;

  useEffect(() => {
    if (effective !== null) {
      prevEffectiveRef.current = effective;
    }
  }, [effective]);

  if (charData === undefined || effective === null) return null;

  const deltas = computeDeltas(charData.baseStats, effective);

  return (
    <section
      aria-label="Character stats"
      data-testid="stat-panel"
      className="w-full rounded-lg border border-rune/20 bg-surface-raised/40 p-3.5 backdrop-blur-md shadow-md shadow-surface-sunken/40 sm:p-4"
    >
      <h2 className="mb-3 font-display text-[9px] font-bold uppercase tracking-[0.2em] text-gold/80">
        Attributes
      </h2>
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6 sm:gap-3">
        {STAT_KEYS.map((key) => {
          const delta = deltas[key];
          const kind = delta > 0 ? 'buff' : delta < 0 ? 'debuff' : 'none';

          const currentVal = effective[key];
          const prevVal = prevEffective ? prevEffective[key] : currentVal;

          let initialColor = COLOR_NEUTRAL;
          if (currentVal > prevVal) {
            initialColor = COLOR_BUFF;
          } else if (currentVal < prevVal) {
            initialColor = COLOR_DEBUFF;
          }

          const finalColor =
            kind === 'buff'
              ? COLOR_BUFF
              : kind === 'debuff'
                ? COLOR_DEBUFF
                : COLOR_NEUTRAL;

          return (
            <div
              key={key}
              data-testid={`stat-${key}`}
              data-delta={kind}
              className="flex flex-col items-center justify-center rounded bg-surface/30 p-2 border border-white/5 transition-colors duration-200 data-[delta=buff]:border-buff/30 data-[delta=buff]:bg-buff/5 data-[delta=debuff]:border-debuff/30 data-[delta=debuff]:bg-debuff/5 sm:p-2.5"
            >
              <span className="text-[9px] font-medium uppercase tracking-wider text-ink-muted/80">
                {STAT_LABELS[key]}
              </span>
              <motion.span
                key={`${key}-${String(effective[key])}`}
                initial={{ scale: 1.4, color: initialColor }}
                animate={{
                  scale: [1.2, 1.0],
                  color: [initialColor, initialColor, finalColor],
                }}
                transition={{ duration: 0.6, times: [0, 0.3, 1.0], ease: 'easeOut' }}
                className="mt-0.5 font-mono text-sm font-bold tracking-tight"
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
