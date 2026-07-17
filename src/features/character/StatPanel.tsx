import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
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
 * Only the final computed value is displayed, color-coded for transient change animations.
 */
export function StatPanel() {
  const { data: charData } = useCharacterQuery();
  const equipped = useInventoryStore((s) => s.equipped);
  const shouldReduceMotion = useReducedMotion();

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
    if (effective !== null) {
      prevEffectiveRef.current = effective;
    }
  }, [effective]);

  if (charData === undefined || effective === null || deltas === null) return null;

  return (
    <section
      aria-label="Character stats"
      data-testid="stat-panel"
      className="w-full rounded-lg border border-rune/20 bg-surface-raised/40 p-3.5 backdrop-blur-md shadow-md shadow-surface-sunken/40 sm:p-4"
    >
      <h2 className="mb-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-gold">
        Attributes
      </h2>
      <dl
        aria-live="polite"
        aria-atomic="true"
        className="grid grid-cols-3 gap-y-3.5 gap-x-2 sm:grid-cols-6 sm:gap-x-4"
      >
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

          const statusText = delta > 0 ? ` (+${delta} bonus)` : delta < 0 ? ` (${delta} penalty)` : '';

          return (
            <div
              key={key}
              data-testid={`stat-${key}`}
              data-delta={kind}
              aria-label={`${STAT_LABELS[key]}: ${effective[key]}${statusText}`}
              className="flex flex-col items-center justify-center rounded bg-surface/30 p-2 border border-white/5 transition-colors duration-200 data-[delta=buff]:border-buff/30 data-[delta=buff]:bg-buff/5 data-[delta=debuff]:border-debuff/30 data-[delta=debuff]:bg-debuff/5 sm:p-2.5"
            >
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-ink/80 sm:text-xs">
                {STAT_LABELS[key]}
              </dt>
              <dd className="mt-0.5 m-0 font-mono text-sm font-bold tracking-tight text-white flex items-center justify-center">
                <motion.span
                  key={`${key}-${String(effective[key])}`}
                  initial={shouldReduceMotion ? false : { scale: 1.25, color: initialColor }}
                  animate={
                    shouldReduceMotion
                      ? { scale: 1.0, color: COLOR_NEUTRAL }
                      : { scale: [1.25, 1.0], color: [initialColor, initialColor, COLOR_NEUTRAL] }
                  }
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { duration: 0.8, times: [0, 0.4, 1.0], ease: 'easeOut' }
                  }
                >
                  {effective[key]}
                </motion.span>
                {delta !== 0 && <span className="sr-only">{statusText}</span>}
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
