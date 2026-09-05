import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from './dnd-test-utils';

describe('Central Paper Doll Column Layout integration', () => {
  it('renders CharacterView and StatPanel in correct column order', async () => {
    await renderApp();

    const main = screen.getByRole('main');
    expect(main).toHaveClass('flex', 'flex-col');

    const characterView = screen.getByTestId('character-view');
    const statPanel = screen.getByTestId('stat-panel');

    expect(characterView).toBeInTheDocument();
    expect(statPanel).toBeInTheDocument();

    // Verify ordering in DOM: CharacterView -> StatPanel
    const posCharacterToStat = characterView.compareDocumentPosition(statPanel);
    expect(posCharacterToStat & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    // Verify paper doll visual centering container
    const characterWrapper = characterView.parentElement;
    expect(characterWrapper).toHaveClass('flex', 'w-full', 'justify-center');
  });

  it('keeps WipBanner in DOM with aria-hidden="true" after dismissal', async () => {
    const user = userEvent.setup();
    await renderApp();

    const banner = screen.getByRole('region', { name: 'Work in progress notice' });
    expect(banner).toBeInTheDocument();
    expect(banner).not.toHaveAttribute('aria-hidden', 'true');

    const dismissButton = screen.getByRole('button', {
      name: 'Dismiss work in progress notice',
    });
    await user.click(dismissButton);

    // No longer exposed as visible region in accessibility tree
    expect(
      screen.queryByRole('region', { name: 'Work in progress notice' }),
    ).not.toBeInTheDocument();

    // Remains in DOM (does not unmount) with aria-hidden="true"
    const dismissedBanner = document.querySelector<HTMLElement>(
      'aside[aria-label="Work in progress notice"]',
    );
    expect(dismissedBanner).not.toBeNull();
    expect(dismissedBanner).toBeInTheDocument();
    expect(dismissedBanner).toHaveAttribute('aria-hidden', 'true');
    expect(dismissedBanner).toHaveClass('invisible', 'max-h-0', 'overflow-hidden');
  });

  it('renders all equipment slots in the paper doll layout', async () => {
    await renderApp();

    const slotTypes = ['head', 'body', 'legs', 'hands', 'feet', 'weapon', 'accessory'] as const;
    for (const slot of slotTypes) {
      const slotElement = screen.getByTestId(`slot-${slot}`);
      expect(slotElement).toBeInTheDocument();
      expect(screen.getByTestId(`slot-empty-${slot}`)).toBeInTheDocument();
    }
  });

  it('renders fixed-positioned utility controls (MuteToggle and GitHubLink)', async () => {
    await renderApp();

    const muteToggle = screen.getByRole('button', { name: /mute sound effects/i });
    expect(muteToggle).toBeInTheDocument();
    expect(muteToggle).toHaveClass('fixed', 'left-4', 'top-4');

    const githubLink = screen.getByRole('link', { name: /view source code on github/i });
    expect(githubLink).toBeInTheDocument();
    expect(githubLink).toHaveClass('fixed', 'right-4', 'top-4');
  });
});
