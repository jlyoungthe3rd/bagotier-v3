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
};

/** Reference ceiling for the stat bar — generous enough to include item bonuses. */
const STAT_MAX: Readonly<Record<StatKey, number>> = {
  hp: 80,
  mp: 60,
  def: 30,
  str: 30,
};

/**
 * Effective-stat panel: derives base + equipped modifiers on every render
 * from store IDs resolved against the React Query cache — values are never
 * stored (invariant I4). Changed stats pulse and show their delta (FR-014).
 */
export function StatPanel() {
  const { data: charData } = useCharacterQuery();
  const equipped = useInventoryStore((s) => s.equipped);
  const reducedMotion = useReducedMotion();

  const { data: equippedItems } = useQuery({
    queryKey: queryKeys.items,
    queryFn: fetchItems,
    select: (items) =>
      Object.values(equipped)
        .filter((id): id is NonNullable<typeof id> => id !== null)
        .map((id) => items.find((i) => i.id === id))
        .filter((i) => i !== undefined),
  });

  if (charData === undefined) return null;

  const effective = computeEffectiveStats(charData.baseStats, equippedItems ?? []);
  const deltas = computeDeltas(charData.baseStats, effective);

  return (
    <section
      aria-label="Character stats"
      data-testid="stat-panel"
      className="w-full shrink-0 rounded border border-slot-idle/40 bg-surface-raised/60 p-3 sm:p-4"
    >
      <h2 className="mb-4 font-display text-[10px] font-bold uppercase tracking-[0.22em] text-gold/80">
        Attributes
      </h2>
      <dl className="flex flex-col gap-3.5">
        {STAT_KEYS.map((key) => {
          const delta = deltas[key];
          const kind = delta > 0 ? 'buff' : delta < 0 ? 'debuff' : 'none';
          const barPct = Math.min(100, (effective[key] / STAT_MAX[key]) * 100);
          const barColor =
            kind === 'buff' ? 'bg-buff' : kind === 'debuff' ? 'bg-debuff' : 'bg-ember';

          return (
            <div
              key={key}
              data-testid={`stat-${key}`}
              data-delta={kind}
              className="space-y-1"
            >
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-[10px] font-semibold uppercase tracking-widest text-ink-muted">
                  {STAT_LABELS[key]}
                </dt>
                <dd className="flex items-baseline gap-1 font-mono">
                  <motion.span
                    key={`${key}-${String(effective[key])}`}
                    initial={reducedMotion === true ? false : { scale: 1.4, color: '#e8ddd0' }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.22 }}
                    className="inline-block text-base font-bold leading-none"
                  >
                    {effective[key]}
                  </motion.span>
                  {delta !== 0 ? (
                    <span
                      data-testid={`stat-${key}-delta`}
                      className={`text-[10px] font-bold ${
                        delta > 0 ? 'text-buff' : 'text-debuff'
                      }`}
                    >
                      {delta > 0 ? `+${String(delta)}` : String(delta)}
                    </span>
                  ) : null}
                </dd>
              </div>
              {/* Stat bar */}
              <div className="h-0.5 overflow-hidden rounded-full bg-slot-idle/60">
                <motion.div
                  className={`h-full rounded-full ${barColor}`}
                  initial={false}
                  animate={{ width: `${String(barPct)}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
