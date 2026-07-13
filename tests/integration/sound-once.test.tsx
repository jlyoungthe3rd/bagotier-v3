import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, fireEvent } from '@testing-library/react';
import { renderApp } from './dnd-test-utils';
import { audioEngine } from '../../src/features/audio/useSound';
import { useInventoryStore } from '../../src/store/useInventoryStore';
import { toItemId } from '../../src/types/domain';

describe('exactly-once sound playback (US4)', () => {
  const playback = vi.spyOn(audioEngine, 'playback').mockImplementation(() => {
    /* silent in tests */
  });

  beforeEach(() => {
    playback.mockClear();
    useInventoryStore.getState().reset();
  });

  it('plays equip sound once on direct click-to-equip', async () => {
    await renderApp();

    const item = screen.getByTestId('item-iron-helm');
    fireEvent.click(item);

    expect(playback).toHaveBeenCalledTimes(1);
    expect(playback).toHaveBeenCalledWith('equip');
  });

  it('plays the equip sound once for a click-to-swap', async () => {
    await renderApp();
    act(() => {
      useInventoryStore.getState().equip(toItemId('iron-helm'), 'head');
    });

    const wizardHat = screen.getByTestId('item-wizard-hat');
    fireEvent.click(wizardHat);

    expect(playback).toHaveBeenCalledTimes(1);
    expect(playback).toHaveBeenCalledWith('equip');
  });

  it('plays the unequip sound once when unequipping an item', async () => {
    await renderApp();
    act(() => {
      useInventoryStore.getState().equip(toItemId('iron-helm'), 'head');
    });

    const item = screen.getByTestId('item-iron-helm');
    fireEvent.click(item);

    expect(playback).toHaveBeenCalledTimes(1);
    expect(playback).toHaveBeenCalledWith('unequip');
  });

  it('plays the invalid sound once when attempting to unequip into a full bag', async () => {
    await renderApp();
    act(() => {
      const ids = Array.from({ length: 24 }, (_, i) =>
        toItemId(i === 0 ? 'iron-helm' : `item-${String(i)}`),
      );
      useInventoryStore.getState().seedBag(ids);
      useInventoryStore.getState().equip(toItemId('iron-helm'), 'head');

      const bagCopy = [...useInventoryStore.getState().bag];
      bagCopy[0] = toItemId('extra-item');
      useInventoryStore.setState({ bag: bagCopy });
    });

    const item = screen.getByTestId('item-iron-helm');
    fireEvent.click(item);

    expect(playback).toHaveBeenCalledTimes(1);
    expect(playback).toHaveBeenCalledWith('invalid');
  });

  it('plays zero sounds when muted (FR-010)', async () => {
    await renderApp();
    act(() => {
      useInventoryStore.getState().toggleMute();
    });

    const item = screen.getByTestId('item-iron-helm');
    fireEvent.click(item);

    expect(playback).not.toHaveBeenCalled();
    expect(useInventoryStore.getState().equipped.head).toBe('iron-helm');
  });
});
