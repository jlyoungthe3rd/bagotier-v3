import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../integration/dnd-test-utils';
import { waitForTooltip, waitForTooltipToClose } from '../integration/item-tooltip-test-utils';

describe('item tooltip UI contract', () => {
  it('renders role=tooltip and associates trigger through aria-describedby', async () => {
    const user = userEvent.setup();
    await renderApp();

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

    await user.hover(screen.getByTestId('item-iron-helm'));
    await waitForTooltip();
    await user.hover(screen.getByTestId('item-wizard-hat'));

    const tooltips = screen.getAllByRole('tooltip');
    expect(tooltips).toHaveLength(1);
    expect(tooltips[0]).toHaveTextContent('Wizard Hat');

    await user.unhover(screen.getByTestId('item-wizard-hat'));
    await waitForTooltipToClose();
  });
});
