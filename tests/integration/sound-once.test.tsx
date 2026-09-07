import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, fireEvent } from '@testing-library/react';
import { renderApp } from './dnd-test-utils';
import { audioEngine } from '../../src/features/audio/useSound';
import { useInventoryStore } from '../../src/store/useInventoryStore';
import { useAppStore } from '../../src/store/useAppStore';
import { toItemId } from '../../src/types/domain';

describe('exactly-once sound playback (US4)', () => {
  const playback = vi.spyOn(audioEngine, 'playback').mockImplementation(() => {
    /* silent in tests */
  });

  beforeEach(() => {
    playback.mockClear();
    useInventoryStore.getState().reset();
    useAppStore.getState().setMuted(false);
  });

  it('plays equip sound once on clicking a fanned-out item', async () => {
    await renderApp();

    // Open fanout for head slot
    act(() => {
      useInventoryStore.getState().setActiveFanoutSlot('head');
    });

    const fannedItem = screen.getByTestId('fanout-item-iron-helm');
    fireEvent.click(fannedItem);

    expect(playback).toHaveBeenCalledTimes(1);
    expect(playback).toHaveBeenCalledWith('equip');
  });

  it('plays the unequip sound once when unequipping an item from slot', async () => {
    await renderApp();
    act(() => {
      useInventoryStore.getState().equip(toItemId('iron-helm'), 'head');
    });

    const item = screen.getByTestId('item-iron-helm');
    fireEvent.click(item);

    expect(playback).toHaveBeenCalledTimes(1);
    expect(playback).toHaveBeenCalledWith('unequip');
  });

  it('plays zero sounds when muted (FR-010)', async () => {
    await renderApp();
    act(() => {
      useAppStore.getState().toggleMute();
      useInventoryStore.getState().setActiveFanoutSlot('head');
    });

    const fannedItem = screen.getByTestId('fanout-item-iron-helm');
    fireEvent.click(fannedItem);

    expect(playback).not.toHaveBeenCalled();
    expect(useInventoryStore.getState().equipped.head).toBe('iron-helm');
  });
});
