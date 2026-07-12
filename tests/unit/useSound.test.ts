import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  __resetAudioForTests,
  preloadSounds,
  useSound,
} from '../../src/features/audio/useSound';
import { useInventoryStore } from '../../src/store/useInventoryStore';

describe('useSound (US4 / FR-009, FR-010)', () => {
  beforeEach(() => {
    __resetAudioForTests();
    useInventoryStore.getState().reset();
  });

  it('creates a fresh AudioBufferSourceNode per play', async () => {
    const { result } = renderHook(() => useSound());
    await preloadSounds();

    result.current('equip');
    result.current('equip');

    const ctx = (globalThis as { __lastAudioContext?: { createBufferSource: unknown } })
      .__lastAudioContext;
    expect(ctx).toBeDefined();
    expect(ctx?.createBufferSource).toHaveBeenCalledTimes(2);
  });

  it('no-ops when muted', async () => {
    const { result } = renderHook(() => useSound());
    await preloadSounds();
    useInventoryStore.getState().toggleMute();

    result.current('pickup');

    const ctx = (globalThis as { __lastAudioContext?: { createBufferSource: unknown } })
      .__lastAudioContext;
    // Context may exist from preload, but no source may be created while muted.
    expect(ctx?.createBufferSource ?? vi.fn()).not.toHaveBeenCalled();
  });

  it('no-ops silently before AudioContext is available (autoplay edge case)', async () => {
    const RealStub = globalThis.AudioContext;
    vi.stubGlobal('AudioContext', undefined);
    try {
      const { result } = renderHook(() => useSound());
      expect(() => {
        result.current('invalid');
      }).not.toThrow();
      await preloadSounds();
      expect(() => {
        result.current('invalid');
      }).not.toThrow();
    } finally {
      vi.stubGlobal('AudioContext', RealStub);
    }
  });

  it('no-ops before buffers are preloaded instead of throwing', () => {
    const { result } = renderHook(() => useSound());
    expect(() => {
      result.current('unequip');
    }).not.toThrow();
  });
});
