import { describe, expect, it } from 'vitest';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { arrow, pickUp, renderApp } from './dnd-test-utils';
import { useInventoryStore } from '../../src/store/useInventoryStore';
import { toItemId, BAG_CAPACITY } from '../../src/types/domain';

/**
 * US3 — unequip via drag slot→grid, swap on occupied slot, full-bag rejection.
 * Layout: slots at y=0 (head at x=0); cells at y=200+, 100px apart, rows of 6.
 */
describe('unequip and swap flows (US3)', () => {
  it('unequips when an equipped item is dragged from its slot to a grid cell', async () => {
    const user = userEvent.setup();
    await renderApp();

    act(() => {
      useInventoryStore.getState().equip(toItemId('iron-helm'), 'head');
    });
    expect(useInventoryStore.getState().equipped.head).toBe('iron-helm');

    // Item now renders inside slot-head at (0,0); cell-0 is at (0,200).
    await pickUp(user, 'item-iron-helm');
    await arrow(user, 'ArrowDown', 8);
    await user.keyboard('{Enter}');

    const s = useInventoryStore.getState();
    expect(s.equipped.head).toBeNull();
    expect(s.bag[0]).toBe('iron-helm');
    expect(
      within(screen.getByTestId('cell-0')).getByTestId('item-iron-helm'),
    ).toBeInTheDocument();
  });

  it('swaps when a compatible bag item is dropped on an occupied slot', async () => {
    const user = userEvent.setup();
    await renderApp();

    act(() => {
      useInventoryStore.getState().equip(toItemId('iron-helm'), 'head');
    });

    // wizard-hat (head) sits in cell 1 at (100, 200); head slot at (0, 0).
    await pickUp(user, 'item-wizard-hat');
    await arrow(user, 'ArrowLeft', 4);
    await arrow(user, 'ArrowUp', 8);
    await user.keyboard('{Enter}');

    const s = useInventoryStore.getState();
    expect(s.equipped.head).toBe('wizard-hat');
    expect(s.bag[1]).toBe('iron-helm'); // displaced into incoming item's cell
    expect(
      within(screen.getByTestId('slot-head')).getByTestId('item-wizard-hat'),
    ).toBeInTheDocument();
  });

  it('rejects unequip into a full bag with a visible message', async () => {
    const user = userEvent.setup();
    await renderApp();

    act(() => {
      const store = useInventoryStore.getState();
      store.equip(toItemId('iron-helm'), 'head');
      // Fill every remaining bag cell.
      useInventoryStore.setState((prev) => ({
        bag: prev.bag.map((cell, i) => cell ?? toItemId(`filler-${String(i)}`)),
      }));
    });
    expect(useInventoryStore.getState().bag.filter((c) => c !== null)).toHaveLength(
      BAG_CAPACITY,
    );

    await pickUp(user, 'item-iron-helm'); // in head slot at (0,0)
    await arrow(user, 'ArrowDown', 8); // over cell-0 (occupied → still unequip attempt)
    await user.keyboard('{Enter}');

    const s = useInventoryStore.getState();
    expect(s.equipped.head).toBe('iron-helm'); // still equipped
    expect(screen.getByText(/bag is full/i)).toBeInTheDocument();
  });

  it('reorders items between bag cells', async () => {
    const user = userEvent.setup();
    await renderApp();

    // iron-helm in cell 0 (0,200) → empty cell 14 (200,400).
    await pickUp(user, 'item-iron-helm');
    await arrow(user, 'ArrowRight', 8);
    await arrow(user, 'ArrowDown', 8);
    await user.keyboard('{Enter}');

    const s = useInventoryStore.getState();
    expect(s.bag[0]).toBeNull();
    expect(s.bag[14]).toBe('iron-helm');
  });
});
