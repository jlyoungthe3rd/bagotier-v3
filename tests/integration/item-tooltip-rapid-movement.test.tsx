import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { useInventoryStore } from '../../src/store/useInventoryStore';
import { renderApp } from './dnd-test-utils';
import { waitForTooltip } from './item-tooltip-test-utils';

describe('item tooltip rapid movement behavior', () => {
  it('hands off tooltip content between adjacent items without overlap', async () => {
    const user = userEvent.setup();
    await renderApp();

    act(() => {
      useInventoryStore.getState().equip('iron-helm' as never, 'head');
      useInventoryStore.getState().equip('steel-cuirass' as never, 'body');
    });

    const first = screen.getByTestId('item-iron-helm');
    const second = screen.getByTestId('item-steel-cuirass');

    await user.hover(first);
    await waitForTooltip();
    await user.hover(second);

    await waitFor(() => {
      const tooltips = screen.getAllByRole('tooltip');
      expect(tooltips).toHaveLength(1);
      expect(tooltips[0]).toHaveTextContent('Steel Cuirass');
    });
  });
});
