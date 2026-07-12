import { describe, expect, it } from 'vitest';
import { mapTooltipContent } from '../../src/features/inventory/tooltip/mapTooltipContent';
import { toItemId, type Item } from '../../src/types/domain';

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: toItemId('tooltip-content'),
    name: 'Rune Gloves',
    icon: '🧤',
    slotType: 'hands',
    modifiers: { str: 2, hp: -1 },
    ...overrides,
  };
}

describe('mapTooltipContent', () => {
  it('maps title/subtitle/modifier lines for populated items', () => {
    const content = mapTooltipContent(makeItem());
    expect(content.isEmpty).toBe(false);
    expect(content.title).toBe('Rune Gloves');
    expect(content.subtitle).toBe('Hands');
    expect(content.metadataLines).toContain('STR +2');
    expect(content.metadataLines).toContain('HP -1');
  });

  it('marks empty content as non-renderable when item name is blank', () => {
    const content = mapTooltipContent(makeItem({ name: '   ' }));
    expect(content.isEmpty).toBe(true);
    expect(content.title).toBe('');
  });

  it('marks empty content as non-renderable when no item is provided', () => {
    const content = mapTooltipContent(null);
    expect(content.isEmpty).toBe(true);
  });
});
