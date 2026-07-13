import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GitHubLink } from '../../src/features/github/GitHubLink';

describe('GitHubLink', () => {
  it('renders correctly with correct href, target, and accessibility labels', () => {
    render(<GitHubLink />);

    const link = screen.getByRole('link', { name: 'View source code on GitHub' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://github.com/jlyoungthe3rd/bagotier-v3');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(screen.getByText('GitHub')).toBeInTheDocument();
  });
});
