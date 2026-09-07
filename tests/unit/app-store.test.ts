import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from '../../src/store/useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.getState().setMuted(false);
  });

  it('initializes with muted as false', () => {
    expect(useAppStore.getState().muted).toBe(false);
  });

  it('toggles muted state via toggleMute()', () => {
    expect(useAppStore.getState().muted).toBe(false);

    useAppStore.getState().toggleMute();
    expect(useAppStore.getState().muted).toBe(true);

    useAppStore.getState().toggleMute();
    expect(useAppStore.getState().muted).toBe(false);
  });

  it('sets muted state directly via setMuted()', () => {
    useAppStore.getState().setMuted(true);
    expect(useAppStore.getState().muted).toBe(true);

    useAppStore.getState().setMuted(false);
    expect(useAppStore.getState().muted).toBe(false);

    useAppStore.getState().setMuted(false);
    expect(useAppStore.getState().muted).toBe(false);
  });
});
