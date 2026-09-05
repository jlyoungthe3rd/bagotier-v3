import { act, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useInventoryStore } from '../../src/store/useInventoryStore';
import { toItemId } from '../../src/types/domain';
import { overrideMockItemIcon, renderApp } from './dnd-test-utils';

describe('inventory icon-only rendering', () => {
  it('shows icon-only content in fanout and equipped slots', async () => {
    await renderApp();

    const headEmptySlot = screen.getByTestId('slot-empty-button-head');
    act(() => {
      headEmptySlot.focus();
    });

    const fanoutTile = within(screen.getByTestId('slot-head')).getByTestId(
      'fanout-item-iron-helm',
    );
    expect(within(fanoutTile).getByText('🪖')).toBeInTheDocument();
    expect(within(fanoutTile).queryByText(/iron helm/i)).toBeNull();

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

  it('shows non-text fallback icon and keeps empty slot visual cues', async () => {
    const restore = overrideMockItemIcon('iron-helm', '   ');
    try {
      await renderApp();

      const headEmptySlot = screen.getByTestId('slot-empty-button-head');
      act(() => {
        headEmptySlot.focus();
      });

      const fanoutTile = within(screen.getByTestId('slot-head')).getByTestId(
        'fanout-item-iron-helm',
      );
      expect(within(fanoutTile).getByText('◻️')).toBeInTheDocument();
      expect(within(fanoutTile).queryByText(/iron helm/i)).toBeNull();

      expect(screen.getByTestId('slot-empty-head')).toBeInTheDocument();
    } finally {
      restore();
    }
  });
});
