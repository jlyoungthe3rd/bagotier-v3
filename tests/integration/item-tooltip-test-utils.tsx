import { screen, waitFor } from '@testing-library/react';
import type userEvent from '@testing-library/user-event';

export async function hoverItem(
  user: ReturnType<typeof userEvent.setup>,
  itemTestId: string,
) {
  const trigger = screen.getByTestId(itemTestId);
  await user.hover(trigger);
  return trigger;
}

export async function unhoverItem(
  user: ReturnType<typeof userEvent.setup>,
  itemTestId: string,
) {
  const trigger = screen.getByTestId(itemTestId);
  await user.unhover(trigger);
}

export async function waitForTooltip() {
  return screen.findByRole('tooltip');
}

export async function waitForTooltipToClose() {
  await waitFor(() => {
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
}
