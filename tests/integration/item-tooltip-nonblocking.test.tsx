import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderApp } from './dnd-test-utils';
import { waitForTooltip } from './item-tooltip-test-utils';

describe('item tooltip non-blocking behavior', () => {
  it('keeps unrelated controls clickable while tooltip is open', async () => {
    const user = userEvent.setup();
    await renderApp();

    await user.hover(screen.getByTestId('item-iron-helm'));
    const tooltip = await waitForTooltip();
    expect(tooltip).toHaveClass('pointer-events-none');

    const muteToggle = screen.getByRole('button', { name: /mute sound effects/i });
    await user.click(muteToggle);

    expect(
      screen.getByRole('button', { name: /unmute sound effects/i }),
    ).toHaveAttribute('aria-pressed', 'true');
  });
});
