import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CharacterFigure } from '../../src/features/character/CharacterView';
import type { CharacterAppearance } from '../../src/types/domain';

function makeAppearance(skin?: string): CharacterAppearance {
  return {
    seed: 12345,
    parts: {
      skin: skin ?? 'skin-01',
      hair: 'hair-01',
      face: 'face-01',
    },
  };
}

describe('CharacterFigure (blank face paper doll)', () => {
  it('renders SVG figure with role="img" and accessible name "Generated character"', () => {
    render(<CharacterFigure appearance={makeAppearance()} />);

    const figure = screen.getByRole('img', { name: 'Generated character' });
    expect(figure).toBeInTheDocument();
    expect(figure.tagName.toLowerCase()).toBe('svg');
    expect(figure).toHaveAttribute('viewBox', '0 0 100 220');
  });

  it('renders a blank face with exactly one head circle and no eyes, mouth, or hair SVG elements', () => {
    const { container } = render(<CharacterFigure appearance={makeAppearance()} />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();

    // Head is represented by exactly 1 circle; no eye circles exist
    const circles = svg?.querySelectorAll('circle') ?? [];
    expect(circles).toHaveLength(1);
    expect(circles[0]).toHaveAttribute('cx', '50');
    expect(circles[0]).toHaveAttribute('cy', '45');
    expect(circles[0]).toHaveAttribute('r', '26');

    // No path elements for hair or mouth
    const paths = svg?.querySelectorAll('path') ?? [];
    expect(paths).toHaveLength(0);

    // Limbs and body: 2 legs, 1 torso, 2 arms = 5 rects
    const rects = svg?.querySelectorAll('rect') ?? [];
    expect(rects).toHaveLength(5);
  });

  it.each([
    ['skin-01', '#e8b88a'],
    ['skin-02', '#c68e5e'],
    ['skin-03', '#8d5a3b'],
  ])('applies skin tone %s (%s) to all body and head elements', (skinKey, expectedColor) => {
    const { container } = render(<CharacterFigure appearance={makeAppearance(skinKey)} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();

    const rects = Array.from(svg?.querySelectorAll('rect') ?? []);
    const circles = Array.from(svg?.querySelectorAll('circle') ?? []);

    expect(rects).toHaveLength(5);
    expect(circles).toHaveLength(1);

    for (const rect of rects) {
      expect(rect).toHaveAttribute('fill', expectedColor);
    }
    expect(circles[0]).toHaveAttribute('fill', expectedColor);
  });

  it('falls back to default skin tone when skin part is missing or unknown', () => {
    const fallbackAppearance: CharacterAppearance = { seed: 12345, parts: {} };
    const { container } = render(<CharacterFigure appearance={fallbackAppearance} />);
    const svg = container.querySelector('svg');

    const rects = Array.from(svg?.querySelectorAll('rect') ?? []);
    const circles = Array.from(svg?.querySelectorAll('circle') ?? []);

    for (const rect of rects) {
      expect(rect).toHaveAttribute('fill', '#e8b88a');
    }
    expect(circles[0]).toHaveAttribute('fill', '#e8b88a');
  });
});
