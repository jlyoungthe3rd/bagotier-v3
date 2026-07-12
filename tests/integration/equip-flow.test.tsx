import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { arrow, pickUp, renderApp } from './dnd-test-utils';
import { useInventoryStore } from '../../src/store/useInventoryStore';

/**
 * US1 — Equip an item via drag and drop.
 * Uses the real dnd-kit KeyboardSensor (25px per arrow press) over
 * deterministic rects: slots at y=0 (x = slotIndex*100), cells at y=200+.
 */
describe('drag-equip flow (US1)', () => {
  it('equips an item dropped on its matching slot and removes it from the grid', async () => {
    const user = userEvent.setup();
    await renderApp();

    // iron-helm (head) starts in cell 0 at (0, 200); head slot is at (0, 0).
    expect(
      within(screen.getByTestId('cell-0')).getByTestId('item-iron-helm'),
    ).toBeInTheDocument();

    await pickUp(user, 'item-iron-helm');
    await arrow(user, 'ArrowUp', 8);
    await user.keyboard('{Enter}');

    expect(useInventoryStore.getState().equipped.head).toBe('iron-helm');
    expect(useInventoryStore.getState().bag[0]).toBeNull();
    expect(
      within(screen.getByTestId('slot-head')).getByTestId('item-iron-helm'),
    ).toBeInTheDocument();
    expect(within(screen.getByTestId('cell-0')).queryByTestId('item-iron-helm')).toBeNull();
  });

  it('rejects a drop on a non-matching slot and returns the item to its origin', async () => {
    const user = userEvent.setup();
    await renderApp();

    // legs slot is at (200, 0); iron-helm is a head item.
    await pickUp(user, 'item-iron-helm');
    await arrow(user, 'ArrowRight', 8);
    await arrow(user, 'ArrowUp', 8);
    await user.keyboard('{Enter}');

    const state = useInventoryStore.getState();
    expect(state.equipped.legs).toBeNull();
    expect(state.equipped.head).toBeNull();
    expect(state.bag[0]).toBe('iron-helm');
    expect(
      within(screen.getByTestId('cell-0')).getByTestId('item-iron-helm'),
    ).toBeInTheDocument();
  });

  it('returns the item to its origin when dropped over empty space (FR-012)', async () => {
    const user = userEvent.setup();
    await renderApp();

    await pickUp(user, 'item-iron-helm');
    await arrow(user, 'ArrowDown', 30); // far below any droppable
    await user.keyboard('{Enter}');

    const state = useInventoryStore.getState();
    expect(state.bag[0]).toBe('iron-helm');
    expect(Object.values(state.equipped).every((v) => v === null)).toBe(true);
  });

  it('returns the item to its origin when the drag is cancelled with Escape', async () => {
    const user = userEvent.setup();
    await renderApp();

    await pickUp(user, 'item-iron-helm');
    await arrow(user, 'ArrowUp', 4);
    await user.keyboard('{Escape}');

    const state = useInventoryStore.getState();
    expect(state.bag[0]).toBe('iron-helm');
    expect(state.activeDrag).toBeNull();
  });

  it('highlights compatible slots as valid and hovered incompatible slots as invalid during a drag (FR-005)', async () => {
    const user = userEvent.setup();
    await renderApp();

    await pickUp(user, 'item-iron-helm');

    // Compatible slot highlights immediately during the drag.
    expect(screen.getByTestId('slot-head')).toHaveAttribute('data-highlight', 'valid');
    expect(screen.getByTestId('slot-legs')).toHaveAttribute('data-highlight', 'idle');

    // Hovering an incompatible slot flags it invalid.
    await arrow(user, 'ArrowRight', 8);
    await arrow(user, 'ArrowUp', 8);
    expect(screen.getByTestId('slot-legs')).toHaveAttribute('data-highlight', 'invalid');

    await user.keyboard('{Escape}');
    expect(screen.getByTestId('slot-head')).toHaveAttribute('data-highlight', 'idle');
  });
});
