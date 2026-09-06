import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { InventoryItem } from '../../src/features/inventory/InventoryItem';
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
      <ItemTooltipProvider>
        <InventoryItem item={item} slot="head" />
      </ItemTooltipProvider>,
    );

    const tile = screen.getByRole('button', { name: 'Iron Helm (head)' });
    expect(tile).toBeInTheDocument();
    expect(screen.getByText('🪖')).toBeInTheDocument();
    expect(screen.queryByText('Iron Helm')).toBeNull();
  });

  it('renders a non-text fallback icon when icon data is empty', () => {
    const item = makeItem({ icon: '   ' });

    render(
      <ItemTooltipProvider>
        <InventoryItem item={item} slot="head" />
      </ItemTooltipProvider>,
    );

    expect(screen.getByText('◻️')).toBeInTheDocument();
    expect(screen.queryByText('Test Item')).toBeNull();
  });

  describe('directional tooltip positioning and slot element anchoring', () => {
    it('renders tooltip with data-placement="left" when tooltipPlacement="left" on hover', async () => {
      const user = userEvent.setup();
      const item = makeItem({ name: 'Iron Helm' });
      const slotElement = document.createElement('div');

      render(
        <ItemTooltipProvider>
          <InventoryItem
            item={item}
            slot="head"
            slotElement={slotElement}
            tooltipPlacement="left"
          />
        </ItemTooltipProvider>,
      );

      const button = screen.getByRole('button');
      await user.hover(button);

      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent('Iron Helm');
      expect(tooltip.getAttribute('data-placement')).toBe('left');

      await user.unhover(button);
      expect(screen.queryByRole('tooltip')).toBeNull();
    });

    it('renders tooltip with data-placement="right" when tooltipPlacement="right" on hover', async () => {
      const user = userEvent.setup();
      const item = makeItem({ name: 'Iron Helm' });
      const slotElement = document.createElement('div');

      render(
        <ItemTooltipProvider>
          <InventoryItem
            item={item}
            slot="weapon"
            slotElement={slotElement}
            tooltipPlacement="right"
          />
        </ItemTooltipProvider>,
      );

      const button = screen.getByRole('button');
      await user.hover(button);

      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent('Iron Helm');
      expect(tooltip.getAttribute('data-placement')).toBe('right');
    });

    it('renders tooltip with data-placement="left" when tooltipPlacement="left" on focus', async () => {
      const item = makeItem({ name: 'Iron Helm' });
      const slotElement = document.createElement('div');

      render(
        <ItemTooltipProvider>
          <InventoryItem
            item={item}
            slot="head"
            slotElement={slotElement}
            tooltipPlacement="left"
          />
        </ItemTooltipProvider>,
      );

      const button = screen.getByRole('button');
      act(() => {
        button.focus();
      });

      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent('Iron Helm');
      expect(tooltip.getAttribute('data-placement')).toBe('left');

      act(() => {
        button.blur();
      });
      expect(screen.queryByRole('tooltip')).toBeNull();
    });

    it('falls back to default placement "right" when tooltipPlacement is omitted', async () => {
      const user = userEvent.setup();
      const item = makeItem({ name: 'Iron Helm' });

      render(
        <ItemTooltipProvider>
          <InventoryItem item={item} slot="head" />
        </ItemTooltipProvider>,
      );

      const button = screen.getByRole('button');
      await user.hover(button);

      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent('Iron Helm');
      expect(tooltip.getAttribute('data-placement')).toBe('right');
    });
  });
});
