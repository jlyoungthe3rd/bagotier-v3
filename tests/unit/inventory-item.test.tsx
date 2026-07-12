import { DndContext } from '@dnd-kit/core';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  InventoryItem,
  ItemTilePreview,
} from '../../src/features/inventory/InventoryItem';
import { ItemTooltipProvider } from '../../src/features/inventory/tooltip';
import type { Item } from '../../src/types/domain';
import { toItemId } from '../../src/types/domain';

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: toItemId('test-item'),
    name: 'Test Item',
    icon: '🪖',
    slotType: 'head',
    modifiers: {},
    ...overrides,
  };
}

describe('InventoryItem', () => {
  it('renders icon-only tile content while preserving aria label', () => {
    const item = makeItem({ name: 'Iron Helm', icon: '🪖' });

    render(
      <DndContext>
        <ItemTooltipProvider>
          <InventoryItem item={item} origin={{ kind: 'bag', index: 0 }} />
        </ItemTooltipProvider>
      </DndContext>,
    );

    const tile = screen.getByRole('button', { name: 'Iron Helm (head)' });
    expect(tile).toBeInTheDocument();
    expect(screen.getByText('🪖')).toBeInTheDocument();
    expect(screen.queryByText('Iron Helm')).toBeNull();
  });

  it('renders a non-text fallback icon when icon data is empty', () => {
    const item = makeItem({ icon: '   ' });

    render(
      <DndContext>
        <ItemTooltipProvider>
          <InventoryItem item={item} origin={{ kind: 'bag', index: 0 }} />
        </ItemTooltipProvider>
      </DndContext>,
    );

    expect(screen.getByText('◻️')).toBeInTheDocument();
    expect(screen.queryByText('Test Item')).toBeNull();
  });
});

describe('ItemTilePreview', () => {
  it('renders icon-only preview and no visible item-name text', () => {
    const item = makeItem({ name: 'Wizard Hat', icon: '🎩' });
    render(<ItemTilePreview item={item} />);
    expect(screen.getByText('🎩')).toBeInTheDocument();
    expect(screen.queryByText('Wizard Hat')).toBeNull();
  });
});
