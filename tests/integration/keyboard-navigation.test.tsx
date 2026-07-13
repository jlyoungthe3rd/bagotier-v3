import { describe, expect, it, vi } from 'vitest';
import { screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from './dnd-test-utils';
import { useInventoryStore } from '../../src/store/useInventoryStore';
import { audioEngine } from '../../src/features/audio/useSound';

describe('keyboard navigation integration flows (US1-5)', () => {
  it('navigates the inventory bag grid with arrow keys', async () => {
    const user = userEvent.setup();
    await renderApp();

    // Start by focusing the first empty/occupied cell button (index 0)
    const cell0 = screen.getByTestId('item-iron-helm');
    act(() => {
      cell0.focus();
    });

    expect(cell0).toHaveFocus();
    expect(useInventoryStore.getState().focusedSection).toBe('bag');
    expect(useInventoryStore.getState().focusedBagIndex).toBe(0);

    // Press ArrowRight to move to cell 1
    await user.keyboard('{ArrowRight}');
    expect(useInventoryStore.getState().focusedBagIndex).toBe(1);

    // Press ArrowDown to move to cell 7 (6 cols in tests by default)
    await user.keyboard('{ArrowDown}');
    expect(useInventoryStore.getState().focusedBagIndex).toBe(7);

    // Press ArrowLeft to move to cell 6
    await user.keyboard('{ArrowLeft}');
    expect(useInventoryStore.getState().focusedBagIndex).toBe(6);

    // Press ArrowUp to move to cell 0
    await user.keyboard('{ArrowUp}');
    expect(useInventoryStore.getState().focusedBagIndex).toBe(0);
  });

  it('shows and dismisses the TAB hint tooltip on grid navigation', async () => {
    const user = userEvent.setup();
    await renderApp();

    // Verify hint is NOT shown initially
    expect(screen.queryByTestId('tab-hint-tooltip')).toBeNull();

    // Focus cell 0
    const cell0 = screen.getByTestId('item-iron-helm');
    act(() => {
      cell0.focus();
    });

    // Press arrow key to trigger hint
    await user.keyboard('{ArrowRight}');

    // Verify hint is now visible
    expect(screen.getByTestId('tab-hint-tooltip')).toBeInTheDocument();
    expect(screen.getByTestId('tab-hint-tooltip')).toHaveTextContent(
      /Press TAB to switch to the paper doll/i,
    );

    // Press Tab to switch focus to paper doll
    await user.keyboard('{Tab}');

    // Verify hint is dismissed
    expect(screen.queryByTestId('tab-hint-tooltip')).toBeNull();
    expect(useInventoryStore.getState().focusedSection).toBe('equipment');
    expect(useInventoryStore.getState().tabHintDismissed).toBe(true);

    // Return to bag and press arrow again — hint should NOT reappear
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    await user.keyboard('{ArrowRight}');
    expect(screen.queryByTestId('tab-hint-tooltip')).toBeNull();
  });

  it('navigates equipment slots and manages equip/unequip cycles', async () => {
    const user = userEvent.setup();
    await renderApp();

    const playbackSpy = vi.spyOn(audioEngine, 'playback');

    // 1. Equip iron-helm (index 0) using Space/Enter
    const ironHelmButton = screen.getByTestId('item-iron-helm');
    act(() => {
      ironHelmButton.focus();
    });

    await user.keyboard('{Enter}');

    // Verify item is equipped in store and DOM
    const store = useInventoryStore.getState();
    expect(store.equipped.head).toBe('iron-helm');
    expect(screen.getByTestId('slot-head')).toContainElement(
      screen.getByTestId('item-iron-helm'),
    );
    expect(playbackSpy).toHaveBeenCalledWith('equip');

    // 2. Focus shifts or is tabbed to equipment slot
    await user.keyboard('{Tab}');
    expect(useInventoryStore.getState().focusedSection).toBe('equipment');
    expect(useInventoryStore.getState().focusedSlot).toBe('head');

    // Focus should be on the newly equipped iron-helm button in the slot
    const equippedHelm = screen.getByTestId('slot-head').querySelector('button');
    expect(equippedHelm).toHaveFocus();

    // 3. Move focus to empty weapon slot (Down from head is body, Left is weapon)
    await user.keyboard('{ArrowDown}'); // to body
    expect(useInventoryStore.getState().focusedSlot).toBe('body');

    await user.keyboard('{ArrowLeft}'); // to weapon
    expect(useInventoryStore.getState().focusedSlot).toBe('weapon');

    const emptyWeaponSlot = screen.getByTestId('slot-empty-button-weapon');
    expect(emptyWeaponSlot).toHaveFocus();

    // Pressing Space on empty slot does nothing
    playbackSpy.mockClear();
    await user.keyboard(' ');
    expect(playbackSpy).not.toHaveBeenCalled();

    // 4. Go back to head slot and unequip
    await user.keyboard('{ArrowUp}'); // weapon to head
    expect(useInventoryStore.getState().focusedSlot).toBe('head');

    await user.keyboard('{Enter}');

    // Verify unequipped
    expect(useInventoryStore.getState().equipped.head).toBeNull();
    expect(screen.getByTestId('slot-empty-button-head')).toHaveFocus();
    expect(playbackSpy).toHaveBeenCalledWith('unequip');

    playbackSpy.mockRestore();
  });
});
