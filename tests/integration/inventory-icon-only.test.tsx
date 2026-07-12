import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { useInventoryStore } from '../../src/store/useInventoryStore';
import { toItemId } from '../../src/types/domain';
import { arrow, overrideMockItemIcon, pickUp, renderApp } from './dnd-test-utils';

describe('inventory icon-only rendering', () => {
  it('shows icon-only content in bag and equipped slots', async () => {
    await renderApp();

    const bagTile = within(screen.getByTestId('cell-0')).getByTestId('item-iron-helm');
    expect(within(bagTile).getByText('🪖')).toBeInTheDocument();
    expect(within(bagTile).queryByText(/iron helm/i)).toBeNull();

    act(() => {
      useInventoryStore.getState().equip(toItemId('iron-helm'), 'head');
    });

    const equippedTile = within(screen.getByTestId('slot-head')).getByTestId(
      'item-iron-helm',
    );
    expect(within(equippedTile).getByText('🪖')).toBeInTheDocument();
    expect(within(equippedTile).queryByText(/iron helm/i)).toBeNull();
    expect(equippedTile).toHaveAccessibleName('Iron Helm (head)');
  });

  it('shows icon-only drag overlay preview', async () => {
    const user = userEvent.setup();
    await renderApp();

    await pickUp(user, 'item-iron-helm');
    await arrow(user, 'ArrowUp', 1);

    const overlay = document.querySelector('.drag-overlay');
    expect(overlay).not.toBeNull();
    expect(within(overlay as HTMLElement).getByText('🪖')).toBeInTheDocument();
    expect(within(overlay as HTMLElement).queryByText(/iron helm/i)).toBeNull();
  });

  it('shows non-text fallback icon and keeps empty slot visual cues', async () => {
    const restore = overrideMockItemIcon('iron-helm', '   ');
    try {
      await renderApp();

      const bagTile = within(screen.getByTestId('cell-0')).getByTestId('item-iron-helm');
      expect(within(bagTile).getByText('◻️')).toBeInTheDocument();
      expect(within(bagTile).queryByText(/iron helm/i)).toBeNull();

      expect(screen.getByTestId('slot-empty-head')).toBeInTheDocument();
      expect(screen.getByTestId('slot-head')).toHaveAttribute('data-highlight', 'idle');
    } finally {
      restore();
    }
  });
});
