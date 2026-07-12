import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { arrow, pickUp, renderApp } from './dnd-test-utils';
import { audioEngine } from '../../src/features/audio/useSound';
import { useInventoryStore } from '../../src/store/useInventoryStore';
import { toItemId } from '../../src/types/domain';

/**
 * US4 — each interaction plays its distinct sound exactly once (SC-004),
 * spied at the audio-engine boundary; mute silences everything.
 */
describe('exactly-once sound playback (US4)', () => {
  const playback = vi.spyOn(audioEngine, 'playback').mockImplementation(() => {
    /* silent in tests */
  });

  beforeEach(() => {
    playback.mockClear();
  });

  it('plays pickup once on drag start and equip once on a valid drop', async () => {
    const user = userEvent.setup();
    await renderApp();

    await pickUp(user, 'item-iron-helm');
    expect(playback).toHaveBeenCalledTimes(1);
    expect(playback).toHaveBeenCalledWith('pickup');

    await arrow(user, 'ArrowUp', 8);
    await user.keyboard('{Enter}');

    expect(playback).toHaveBeenCalledTimes(2);
    expect(playback).toHaveBeenLastCalledWith('equip');
  });

  it('plays the equip sound once for a swap', async () => {
    const user = userEvent.setup();
    await renderApp();
    act(() => {
      useInventoryStore.getState().equip(toItemId('iron-helm'), 'head');
    });

    await pickUp(user, 'item-wizard-hat'); // cell 1 → occupied head slot
    await arrow(user, 'ArrowLeft', 4);
    await arrow(user, 'ArrowUp', 8);
    await user.keyboard('{Enter}');

    expect(playback.mock.calls.filter(([e]) => e === 'equip')).toHaveLength(1);
  });

  it('plays the unequip sound once when dragging slot → grid', async () => {
    const user = userEvent.setup();
    await renderApp();
    act(() => {
      useInventoryStore.getState().equip(toItemId('iron-helm'), 'head');
    });

    await pickUp(user, 'item-iron-helm');
    await arrow(user, 'ArrowDown', 8);
    await user.keyboard('{Enter}');

    expect(playback.mock.calls.filter(([e]) => e === 'unequip')).toHaveLength(1);
  });

  it('plays the invalid sound once for a rejected drop', async () => {
    const user = userEvent.setup();
    await renderApp();

    await pickUp(user, 'item-iron-helm');
    await arrow(user, 'ArrowRight', 8); // legs slot — wrong type
    await arrow(user, 'ArrowUp', 8);
    await user.keyboard('{Enter}');

    expect(playback.mock.calls.filter(([e]) => e === 'invalid')).toHaveLength(1);
  });

  it('plays the invalid sound once when a drag is cancelled', async () => {
    const user = userEvent.setup();
    await renderApp();

    await pickUp(user, 'item-iron-helm');
    await user.keyboard('{Escape}');

    expect(playback.mock.calls.filter(([e]) => e === 'invalid')).toHaveLength(1);
  });

  it('plays no sound for a bag reorder', async () => {
    const user = userEvent.setup();
    await renderApp();

    await pickUp(user, 'item-iron-helm');
    playback.mockClear();
    await arrow(user, 'ArrowRight', 8);
    await arrow(user, 'ArrowDown', 8); // empty cell 14
    await user.keyboard('{Enter}');

    expect(playback).not.toHaveBeenCalled();
  });

  it('plays zero sounds when muted (FR-010)', async () => {
    const user = userEvent.setup();
    await renderApp();
    act(() => {
      useInventoryStore.getState().toggleMute();
    });

    await pickUp(user, 'item-iron-helm');
    await arrow(user, 'ArrowUp', 8);
    await user.keyboard('{Enter}');

    expect(playback).not.toHaveBeenCalled();
    expect(useInventoryStore.getState().equipped.head).toBe('iron-helm');
  });
});
