/**
 * Centralized query key factory — the only place query keys are produced
 * (store-contracts.md rule 4).
 */
export const queryKeys = {
  items: ['items'] as const,
  character: ['character'] as const,
};
