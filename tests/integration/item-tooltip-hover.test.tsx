import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from './dnd-test-utils';
import {
  hoverItem,
  unhoverItem,
  waitForTooltip,
  waitForTooltipToClose,
} from './item-tooltip-test-utils';

describe('item tooltip hover/focus behavior', () => {
  it('opens on hover and closes on unhover', async () => {
    const user = userEvent.setup();
    await renderApp();

    const trigger = await hoverItem(user, 'item-iron-helm');
    const tooltip = await waitForTooltip();
    expect(tooltip).toHaveTextContent('Iron Helm');
    expect(trigger.getAttribute('aria-describedby')).toContain(tooltip.id);

    await unhoverItem(user, 'item-iron-helm');
    await waitForTooltipToClose();
  });

  it('opens on focus and closes on Escape while preserving trigger focus', async () => {
    const user = userEvent.setup();
    await renderApp();

    const trigger = screen.getByTestId('item-wizard-hat');
    trigger.focus();
    const tooltip = await waitForTooltip();
    expect(tooltip).toHaveTextContent('Wizard Hat');
    expect(trigger).toHaveFocus();

    await user.keyboard('{Escape}');
    await waitForTooltipToClose();
    expect(trigger).toHaveFocus();
  });
});
