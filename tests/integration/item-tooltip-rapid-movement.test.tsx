import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from './dnd-test-utils';
import { waitForTooltip } from './item-tooltip-test-utils';

describe('item tooltip rapid movement behavior', () => {
  it('hands off tooltip content between adjacent items without overlap', async () => {
    const user = userEvent.setup();
    await renderApp();

    const first = screen.getByTestId('item-iron-helm');
    const second = screen.getByTestId('item-wizard-hat');

    await user.hover(first);
    await waitForTooltip();
    await user.hover(second);

    await waitFor(() => {
      const tooltips = screen.getAllByRole('tooltip');
      expect(tooltips).toHaveLength(1);
      expect(tooltips[0]).toHaveTextContent('Wizard Hat');
    });
  });
});
