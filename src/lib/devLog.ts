/**
 * Dev-only performance logging (T049 / Constitution performance budgets).
 * Logs drop → state-update timing so regressions against the ≤100ms stat
 * update budget are visible during development. No-ops in production.
 */
const enabled = import.meta.env.DEV;

export function logDropTiming(outcome: string, startMs: number): void {
  if (!enabled) return;
  const elapsed = performance.now() - startMs;
  const budgetMs = 100;
  const status = elapsed <= budgetMs ? 'ok' : 'OVER BUDGET';
  // eslint-disable-next-line no-console
  console.debug(
    `[inventory] drop outcome=${outcome} handled in ${elapsed.toFixed(1)}ms (${status}, budget ${String(budgetMs)}ms)`,
  );
}
