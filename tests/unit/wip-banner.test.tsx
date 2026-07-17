import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { WipBanner } from '../../src/features/banner/WipBanner';

describe('WipBanner', () => {
  it('renders work in progress notice with region role and label', () => {
    render(<WipBanner />);

    const banner = screen.getByRole('region', { name: 'Work in progress notice' });
    expect(banner).toBeInTheDocument();
    expect(screen.getByText('WIP')).toBeInTheDocument();
    expect(
      screen.getByText(/Work in Progress — Features under active development/i),
    ).toBeInTheDocument();
  });

  it('dismisses the banner when dismiss button is clicked', async () => {
    const user = userEvent.setup();
    render(<WipBanner />);

    const dismissBtn = screen.getByRole('button', {
      name: 'Dismiss work in progress notice',
    });
    expect(dismissBtn).toBeInTheDocument();

    await user.click(dismissBtn);

    expect(
      screen.queryByRole('region', { name: 'Work in progress notice' }),
    ).not.toBeInTheDocument();
  });
});
