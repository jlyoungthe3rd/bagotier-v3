import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
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

  it('renders all equipment slots in the paper doll layout', async () => {
    await renderApp();

    const slotTypes = [
      'head',
      'body',
      'legs',
      'hands',
      'feet',
      'weapon',
      'accessory',
    ] as const;
    for (const slot of slotTypes) {
      const slotElement = screen.getByTestId(`slot-${slot}`);
      expect(slotElement).toBeInTheDocument();
      expect(screen.getByTestId(`slot-empty-${slot}`)).toBeInTheDocument();
    }
  });

  it('renders fixed-positioned utility controls (GitHubLink)', async () => {
    await renderApp();

    const githubLink = screen.getByRole('link', { name: /view source code on github/i });
    expect(githubLink).toBeInTheDocument();
    expect(githubLink).toHaveClass('fixed', 'right-4', 'top-4');
  });
});
