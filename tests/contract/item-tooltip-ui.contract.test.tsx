import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { useInventoryStore } from '../../src/store/useInventoryStore';
import { renderApp } from '../integration/dnd-test-utils';
import {
  waitForTooltip,
  waitForTooltipToClose,
} from '../integration/item-tooltip-test-utils';

describe('item tooltip UI contract', () => {
  it('renders role=tooltip and associates trigger through aria-describedby', async () => {
    const user = userEvent.setup();
    await renderApp();

    act(() => {
      useInventoryStore.getState().equip('iron-helm' as never, 'head');
    });

    const trigger = screen.getByTestId('item-iron-helm');
    await user.hover(trigger);
    const tooltip = await waitForTooltip();

    expect(tooltip).toHaveAttribute('role', 'tooltip');
    expect(trigger.getAttribute('aria-describedby')).toContain(tooltip.id);
    expect(tooltip.querySelector('button, a, input, select, textarea')).toBeNull();
  });

  it('does not render multiple simultaneous tooltip nodes when moving between items', async () => {
    const user = userEvent.setup();
    await renderApp();

    act(() => {
      useInventoryStore.getState().equip('iron-helm' as never, 'head');
      useInventoryStore.getState().equip('steel-cuirass' as never, 'body');
    });

    await user.hover(screen.getByTestId('item-iron-helm'));
    await waitForTooltip();
    await user.hover(screen.getByTestId('item-steel-cuirass'));

    const tooltips = screen.getAllByRole('tooltip');
    expect(tooltips).toHaveLength(1);
    expect(tooltips[0]).toHaveTextContent('Steel Cuirass');

    await user.unhover(screen.getByTestId('item-steel-cuirass'));
    await waitForTooltipToClose();
  });
});
