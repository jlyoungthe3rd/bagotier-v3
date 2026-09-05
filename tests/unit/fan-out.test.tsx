import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FanOut } from '../../src/features/character/FanOut';
import { ItemTooltipProvider } from '../../src/features/inventory/tooltip';
import { audioEngine } from '../../src/features/audio/useSound';
import { registerItemSlotTypes, useInventoryStore } from '../../src/store/useInventoryStore';
import { items } from '../../src/mocks/items';
import type { Item } from '../../src/types/domain';

const headItems = items.filter((i) => i.slotType === 'head'); // [iron-helm, wizard-hat]
const singleItem = [headItems[0] as Item];

function renderFanOut(props: { slot?: 'head' | 'weapon' | 'body'; items?: readonly Item[] } = {}) {
  const { slot = 'head', items: fanItems = headItems } = props;
  return render(
    <ItemTooltipProvider>
      <FanOut slot={slot} items={fanItems} />
    </ItemTooltipProvider>,
  );
}

describe('FanOut component', () => {
  beforeEach(() => {
    useInventoryStore.getState().reset();
    registerItemSlotTypes(Object.fromEntries(items.map((i) => [i.id, i.slotType])));
    useInventoryStore.getState().seedUnequipped(items.map((i) => i.id));
    useInventoryStore.getState().setActiveFanoutSlot('head');
  });

  describe('radial positioning & rendering', () => {
    it('renders role="listbox" with options for each item', () => {
      renderFanOut();

      const listbox = screen.getByRole('listbox');
      expect(listbox).toBeInTheDocument();
      expect(listbox).toHaveAttribute('aria-label', 'Available items for head slot');

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(2);
      expect(options[0]).toHaveAttribute('data-testid', 'fanout-item-iron-helm');
      expect(options[1]).toHaveAttribute('data-testid', 'fanout-item-wizard-hat');
    });

    it('positions single item directly along center direction angle', () => {
      renderFanOut({ slot: 'head', items: singleItem });

      const option = screen.getByRole('option');
      expect(option).toHaveAttribute('data-testid', 'fanout-item-iron-helm');
      const motionWrapper = option.parentElement;
      expect(motionWrapper).toBeInTheDocument();
    });

    it('positions multiple items along an arc spread', () => {
      renderFanOut({ slot: 'head', items: headItems });

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(2);
      expect(options[0]).toBeDefined();
      expect(options[1]).toBeDefined();
      expect(options[0]?.parentElement).toHaveClass('pointer-events-auto');
      expect(options[1]?.parentElement).toHaveClass('pointer-events-auto');
    });

    it('renders fallback icon when item icon is empty', () => {
      const firstHeadItem = headItems[0] as Item;
      const emptyIconItem: Item = {
        ...firstHeadItem,
        id: 'test-helm' as never,
        icon: '   ',
      };
      renderFanOut({ slot: 'head', items: [emptyIconItem] });

      const option = screen.getByRole('option');
      expect(option).toHaveTextContent('◻️');
    });
  });

  describe('keyboard navigation', () => {
    it('ArrowRight advances focused index and cycles back to start', async () => {
      const user = userEvent.setup();
      renderFanOut();

      expect(useInventoryStore.getState().focusedFanoutIndex).toBe(0);

      await user.keyboard('{ArrowRight}');
      expect(useInventoryStore.getState().focusedFanoutIndex).toBe(1);

      // Wraps back to 0
      await user.keyboard('{ArrowRight}');
      expect(useInventoryStore.getState().focusedFanoutIndex).toBe(0);
    });

    it('ArrowLeft cycles backwards through items', async () => {
      const user = userEvent.setup();
      renderFanOut();

      expect(useInventoryStore.getState().focusedFanoutIndex).toBe(0);

      // Backwards from 0 wraps to 1 (last item)
      await user.keyboard('{ArrowLeft}');
      expect(useInventoryStore.getState().focusedFanoutIndex).toBe(1);

      await user.keyboard('{ArrowLeft}');
      expect(useInventoryStore.getState().focusedFanoutIndex).toBe(0);
    });

    it('Enter key equips the selected item and closes fan-out', async () => {
      const user = userEvent.setup();
      const playbackSpy = vi.spyOn(audioEngine, 'playback');
      renderFanOut();

      // First item is iron-helm at index 0
      await user.keyboard('{Enter}');

      expect(useInventoryStore.getState().equipped.head).toBe('iron-helm');
      expect(useInventoryStore.getState().activeFanoutSlot).toBeNull();
      expect(playbackSpy).toHaveBeenCalledWith('equip');

      playbackSpy.mockRestore();
    });

    it('Space key equips the selected item and closes fan-out', async () => {
      const user = userEvent.setup();
      const playbackSpy = vi.spyOn(audioEngine, 'playback');
      renderFanOut();

      // Navigate to second item (wizard-hat)
      await user.keyboard('{ArrowRight}');
      expect(useInventoryStore.getState().focusedFanoutIndex).toBe(1);

      await user.keyboard(' ');

      expect(useInventoryStore.getState().equipped.head).toBe('wizard-hat');
      expect(useInventoryStore.getState().activeFanoutSlot).toBeNull();
      expect(playbackSpy).toHaveBeenCalledWith('equip');

      playbackSpy.mockRestore();
    });

    it('Escape key dismisses the fan-out without equipping', async () => {
      const user = userEvent.setup();
      renderFanOut();

      expect(useInventoryStore.getState().activeFanoutSlot).toBe('head');

      await user.keyboard('{Escape}');

      expect(useInventoryStore.getState().activeFanoutSlot).toBeNull();
      expect(useInventoryStore.getState().equipped.head).toBeNull();
    });
  });

  describe('click / equip action', () => {
    it('equips item on click, dismisses fan-out, and plays sound', async () => {
      const user = userEvent.setup();
      const playbackSpy = vi.spyOn(audioEngine, 'playback');
      renderFanOut();

      const wizardHatBtn = screen.getByTestId('fanout-item-wizard-hat');
      await user.click(wizardHatBtn);

      expect(useInventoryStore.getState().equipped.head).toBe('wizard-hat');
      expect(useInventoryStore.getState().activeFanoutSlot).toBeNull();
      expect(playbackSpy).toHaveBeenCalledWith('equip');

      playbackSpy.mockRestore();
    });
  });

  describe('tooltip integration', () => {
    it('opens tooltip on hover and closes on leave', async () => {
      const user = userEvent.setup();
      renderFanOut();

      const itemBtn = screen.getByTestId('fanout-item-iron-helm');
      await user.hover(itemBtn);

      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent('Iron Helm');
      expect(itemBtn.getAttribute('aria-describedby')).toContain(tooltip.id);

      await user.unhover(itemBtn);
      expect(screen.queryByRole('tooltip')).toBeNull();
    });

    it('opens tooltip on focus and updates focusedFanoutIndex', async () => {
      renderFanOut();

      const secondBtn = screen.getByTestId('fanout-item-wizard-hat');
      act(() => {
        secondBtn.focus();
      });

      expect(useInventoryStore.getState().focusedFanoutIndex).toBe(1);
      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent('Wizard Hat');

      act(() => {
        secondBtn.blur();
      });
      expect(screen.queryByRole('tooltip')).toBeNull();
    });
  });
});
