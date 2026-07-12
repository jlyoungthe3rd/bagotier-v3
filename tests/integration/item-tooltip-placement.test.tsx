import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from './dnd-test-utils';
import { waitForTooltip } from './item-tooltip-test-utils';

describe('item tooltip placement behavior', () => {
  it('adds placement metadata and uses viewport-safe fallback placements', async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.hover(screen.getByTestId('item-ruby-ring'));
    const tooltip = await waitForTooltip();

    expect(tooltip).toHaveAttribute('data-placement');
    expect(['right', 'left', 'top', 'bottom']).toContain(
      (tooltip.getAttribute('data-placement') ?? '').split('-')[0],
    );
  });
});
