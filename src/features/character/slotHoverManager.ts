import type { SlotType } from '../../types/domain';

export const BASE_HOVER_DELAY = 300;
export const FAST_HOVER_DELAY = 200;
export const HOVER_WARM_WINDOW = 2000;

let lastHoveredSlot: SlotType | null = null;
let lastHoverTime = 0;
let visitedSlotsCount = 0;

/**
 * Computes the fan-out hover delay for a slot:
 * - Default: 300ms
 * - If user looks at more than one item slot within 2000ms: 200ms
 * - Resets back to 300ms after 2000ms of inactivity between visiting slots
 */
export function getSlotHoverDelay(slot: SlotType, now: number = Date.now()): number {
  const isWarm = lastHoverTime > 0 && now - lastHoverTime < HOVER_WARM_WINDOW;

  if (!isWarm) {
    visitedSlotsCount = 1;
    lastHoveredSlot = slot;
    lastHoverTime = now;
    return BASE_HOVER_DELAY;
  }

  if (slot !== lastHoveredSlot) {
    visitedSlotsCount++;
    lastHoveredSlot = slot;
  }
  lastHoverTime = now;

  return visitedSlotsCount > 1 ? FAST_HOVER_DELAY : BASE_HOVER_DELAY;
}

/**
 * Updates the last activity timestamp for the current slot to keep the warm window alive.
 */
export function recordSlotActivity(slot: SlotType, now: number = Date.now()): void {
  lastHoveredSlot = slot;
  lastHoverTime = now;
}

/** Resets the hover manager state (used in tests and on reset). */
export function resetSlotHoverManager(): void {
  lastHoveredSlot = null;
  lastHoverTime = 0;
  visitedSlotsCount = 0;
}
