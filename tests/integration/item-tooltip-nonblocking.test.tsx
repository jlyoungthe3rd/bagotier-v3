import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { useInventoryStore } from '../../src/store/useInventoryStore';
import { renderApp } from './dnd-test-utils';
import { waitForTooltip } from './item-tooltip-test-utils';

describe('item tooltip non-blocking behavior', () => {
  it('keeps unrelated controls clickable while tooltip is open', async () => {
    const user = userEvent.setup();
    await renderApp();

    act(() => {
      useInventoryStore.getState().equip('iron-helm' as never, 'head');
    });

    await user.hover(screen.getByTestId('item-iron-helm'));
    const tooltip = await waitForTooltip();
    expect(tooltip).toHaveClass('pointer-events-none');

    const bodySlot = screen.getByTestId('slot-empty-button-body');
    await user.click(bodySlot);

    expect(useInventoryStore.getState().activeFanoutSlot).toBe('body');
  });
});
