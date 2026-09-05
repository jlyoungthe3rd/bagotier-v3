import { describe, expect, it, vi } from 'vitest';
import { screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from './dnd-test-utils';
import { useInventoryStore } from '../../src/store/useInventoryStore';
import { audioEngine } from '../../src/features/audio/useSound';

describe('keyboard navigation integration flows (US1-5)', () => {
  it('opens fan-out on focusing an empty slot and equips via Enter', async () => {
    const user = userEvent.setup();
    await renderApp();

    const playbackSpy = vi.spyOn(audioEngine, 'playback');

    // 1. Focus the head empty slot
    const headEmptySlot = screen.getByTestId('slot-empty-button-head');
    act(() => {
      headEmptySlot.focus();
    });

    expect(screen.getByTestId('fanout-item-iron-helm')).toHaveFocus();
    expect(useInventoryStore.getState().focusedSection).toBe('equipment');
    expect(useInventoryStore.getState().focusedSlot).toBe('head');

    // Fan-out opens immediately on keyboard focus
    expect(useInventoryStore.getState().activeFanoutSlot).toBe('head');
    expect(screen.getByTestId('fanout-item-iron-helm')).toBeInTheDocument();

    // 2. The first fanout item should be focused or navigable via Arrow keys
    await user.keyboard('{ArrowRight}');
    expect(useInventoryStore.getState().focusedFanoutIndex).toBe(1);

    // 3. Press Enter to equip
    await user.keyboard('{Enter}');

    // Verify item is equipped and fan-out is closed
    expect(useInventoryStore.getState().equipped.head).toBe('wizard-hat');
    expect(useInventoryStore.getState().activeFanoutSlot).toBeNull();
    expect(playbackSpy).toHaveBeenCalledWith('equip');

    playbackSpy.mockRestore();
  });

  it('closes fan-out on Escape key', async () => {
    const user = userEvent.setup();
    await renderApp();

    const headEmptySlot = screen.getByTestId('slot-empty-button-head');
    act(() => {
      headEmptySlot.focus();
    });

    expect(useInventoryStore.getState().activeFanoutSlot).toBe('head');

    // Press Escape to dismiss fan-out
    await user.keyboard('{Escape}');
    expect(useInventoryStore.getState().activeFanoutSlot).toBeNull();
  });

  it('navigates equipment slots and unequips item on Enter', async () => {
    const user = userEvent.setup();
    await renderApp();

    const playbackSpy = vi.spyOn(audioEngine, 'playback');

    // Equip iron helm directly in store
    act(() => {
      useInventoryStore.getState().equip('iron-helm' as never, 'head');
      useInventoryStore.getState().setActiveFanoutSlot(null);
    });

    // Focus equipped item
    const equippedHelm = screen.getByTestId('item-iron-helm');
    act(() => {
      equippedHelm.focus();
    });

    expect(useInventoryStore.getState().focusedSlot).toBe('head');

    // Press Enter to unequip
    await user.keyboard('{Enter}');

    expect(useInventoryStore.getState().equipped.head).toBeNull();
    expect(playbackSpy).toHaveBeenCalledWith('unequip');

    playbackSpy.mockRestore();
  });
});
