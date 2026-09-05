import { beforeEach, describe, expect, it } from 'vitest';
import {
  BASE_HOVER_DELAY,
  FAST_HOVER_DELAY,
  HOVER_WARM_WINDOW,
  getSlotHoverDelay,
  recordSlotActivity,
  resetSlotHoverManager,
} from '../../src/features/character/slotHoverManager';

describe('slotHoverManager', () => {
  beforeEach(() => {
    resetSlotHoverManager();
  });

  it('returns base delay (300ms) on initial slot hover', () => {
    expect(HOVER_WARM_WINDOW).toBe(2000);
    const delay = getSlotHoverDelay('head', 1000);
    expect(delay).toBe(BASE_HOVER_DELAY);
    expect(delay).toBe(300);
  });

  it('switches to fast delay (200ms) when visiting a second slot within 2000ms', () => {
    // Visit first slot at t = 1000
    const delay1 = getSlotHoverDelay('head', 1000);
    expect(delay1).toBe(300);

    // Visit second slot at t = 1400 (400ms later, < 2000ms)
    const delay2 = getSlotHoverDelay('weapon', 1400);
    expect(delay2).toBe(FAST_HOVER_DELAY);
    expect(delay2).toBe(200);

    // Visit third slot at t = 1800 (400ms later, < 2000ms)
    const delay3 = getSlotHoverDelay('body', 1800);
    expect(delay3).toBe(200);
  });

  it('resets to base delay (300ms) if 2000ms or more elapses without visiting another slot', () => {
    // Visit first slot at t = 1000
    getSlotHoverDelay('head', 1000);
    // Visit second slot at t = 1300 -> warm (200ms)
    expect(getSlotHoverDelay('weapon', 1300)).toBe(200);

    // Wait 2500ms (t = 3800 > 1300 + 2000)
    const delayAfterCooldown = getSlotHoverDelay('feet', 3800);
    expect(delayAfterCooldown).toBe(BASE_HOVER_DELAY);
    expect(delayAfterCooldown).toBe(300);

    // Visiting another slot shortly after reset warms it back up to 200ms
    const delaySecondAfterCooldown = getSlotHoverDelay('hands', 4200);
    expect(delaySecondAfterCooldown).toBe(FAST_HOVER_DELAY);
    expect(delaySecondAfterCooldown).toBe(200);
  });

  it('keeps warm window alive with recordSlotActivity', () => {
    // Visit first slot at t = 1000
    getSlotHoverDelay('head', 1000);
    // User hovers and moves inside slot, recording activity at t = 2000
    recordSlotActivity('head', 2000);

    // Visit second slot at t = 3500 (1500ms after last activity, < 2000ms)
    const delay = getSlotHoverDelay('legs', 3500);
    expect(delay).toBe(200);
  });
});
