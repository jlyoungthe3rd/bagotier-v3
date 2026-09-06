import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EquipmentSlot } from '../../src/features/character/EquipmentSlot';
import { FanOut } from '../../src/features/character/FanOut';
import { InventoryItem } from '../../src/features/inventory/InventoryItem';
import {
  registerItemSlotTypes,
  useInventoryStore,
} from '../../src/store/useInventoryStore';
import { items } from '../../src/mocks/items';
import { resetSlotHoverManager } from '../../src/features/character/slotHoverManager';
import type { ItemId, SlotType } from '../../src/types/domain';

import type * as TooltipModule from '../../src/features/inventory/tooltip';

const mockOpen = vi.fn();
const mockCloseFor = vi.fn();
const mockDismiss = vi.fn();
const mockAriaDescribedByFor = vi.fn();

vi.mock('../../src/features/inventory/tooltip', async () => {
  const actual = await vi.importActual<typeof TooltipModule>(
    '../../src/features/inventory/tooltip',
  );
  return {
    ...actual,
    useItemTooltip: () => ({
      tooltipId: 'mock-tooltip-id',
      open: mockOpen,
      closeFor: mockCloseFor,
      dismiss: mockDismiss,
      ariaDescribedByFor: mockAriaDescribedByFor,
    }),
  };
});

function renderEquipmentSlot(slot: SlotType, itemId: ItemId | null = null) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(['items'], items);

  const view = render(
    <QueryClientProvider client={queryClient}>
      <EquipmentSlot slot={slot} itemId={itemId} />
    </QueryClientProvider>,
  );

  return {
    ...view,
    rerenderWithItem: (newItemId: ItemId) =>
      view.rerender(
        <QueryClientProvider client={queryClient}>
          <EquipmentSlot slot={slot} itemId={newItemId} />
        </QueryClientProvider>,
      ),
  };
}

describe('Slot-anchored directional tooltip positioning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSlotHoverManager();
    useInventoryStore.getState().reset();
    registerItemSlotTypes(Object.fromEntries(items.map((i) => [i.id, i.slotType])));
    useInventoryStore.getState().seedUnequipped(items.map((i) => i.id));
  });

  describe('equipped item in EquipmentSlot', () => {
    it('calls tooltip.open with slot container element and "right" placement for left-fanning weapon slot on hover', async () => {
      const user = userEvent.setup();
      const { rerenderWithItem } = renderEquipmentSlot('weapon', null);

      act(() => {
        useInventoryStore.getState().equip('bronze-sword' as never, 'weapon');
      });
      rerenderWithItem('bronze-sword' as never);

      const slotElement = screen.getByTestId('slot-weapon');
      const itemButton = screen.getByTestId('item-bronze-sword');

      await user.hover(itemButton);

      expect(mockOpen).toHaveBeenCalledTimes(1);
      expect(mockOpen).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'bronze-sword' }),
        'hover',
        slotElement,
        'right',
      );
      // Explicitly verify it is anchored to slot container, not item button
      expect(mockOpen.mock.calls[0]![2]).toBe(slotElement);
      expect(mockOpen.mock.calls[0]![2]).not.toBe(itemButton);
    });

    it('calls tooltip.open with slot container element and "left" placement for right-fanning head slot on hover', async () => {
      const user = userEvent.setup();
      const { rerenderWithItem } = renderEquipmentSlot('head', null);

      act(() => {
        useInventoryStore.getState().equip('iron-helm' as never, 'head');
      });
      rerenderWithItem('iron-helm' as never);

      const slotElement = screen.getByTestId('slot-head');
      const itemButton = screen.getByTestId('item-iron-helm');

      await user.hover(itemButton);

      expect(mockOpen).toHaveBeenCalledTimes(1);
      expect(mockOpen).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'iron-helm' }),
        'hover',
        slotElement,
        'left',
      );
      expect(mockOpen.mock.calls[0]![2]).toBe(slotElement);
      expect(mockOpen.mock.calls[0]![2]).not.toBe(itemButton);
    });

    it('calls tooltip.open with slot container element and placement on keyboard focus', () => {
      const { rerenderWithItem } = renderEquipmentSlot('weapon', null);

      act(() => {
        useInventoryStore.getState().equip('bronze-sword' as never, 'weapon');
      });
      rerenderWithItem('bronze-sword' as never);

      const slotElement = screen.getByTestId('slot-weapon');
      const itemButton = screen.getByTestId('item-bronze-sword');

      act(() => {
        itemButton.focus();
      });

      expect(mockOpen).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'bronze-sword' }),
        'focus',
        slotElement,
        'right',
      );
    });
  });

  describe('fan-out items in EquipmentSlot', () => {
    it('calls tooltip.open with slot container element and "right" placement for left-fanning weapon fan-out items on hover', async () => {
      const user = userEvent.setup();
      renderEquipmentSlot('weapon', null);

      act(() => {
        useInventoryStore.getState().setActiveFanoutSlot('weapon');
      });

      const slotElement = screen.getByTestId('slot-weapon');
      const fanoutButton = screen.getByTestId('fanout-item-bronze-sword');

      await user.hover(fanoutButton);

      expect(mockOpen).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'bronze-sword' }),
        'hover',
        slotElement,
        'right',
      );
      expect(mockOpen.mock.calls[0]![2]).toBe(slotElement);
      expect(mockOpen.mock.calls[0]![2]).not.toBe(fanoutButton);
    });

    it('calls tooltip.open with slot container element and "left" placement for right-fanning head fan-out items on hover', async () => {
      const user = userEvent.setup();
      renderEquipmentSlot('head', null);

      act(() => {
        useInventoryStore.getState().setActiveFanoutSlot('head');
      });

      const slotElement = screen.getByTestId('slot-head');
      const fanoutButton = screen.getByTestId('fanout-item-iron-helm');

      await user.hover(fanoutButton);

      expect(mockOpen).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'iron-helm' }),
        'hover',
        slotElement,
        'left',
      );
      expect(mockOpen.mock.calls[0]![2]).toBe(slotElement);
      expect(mockOpen.mock.calls[0]![2]).not.toBe(fanoutButton);
    });

    it('calls tooltip.open with slot container element and placement on fan-out keyboard focus', () => {
      renderEquipmentSlot('head', null);

      act(() => {
        useInventoryStore.getState().setActiveFanoutSlot('head');
      });

      const slotElement = screen.getByTestId('slot-head');
      const fanoutButton = screen.getByTestId('fanout-item-wizard-hat');

      act(() => {
        fanoutButton.focus();
      });

      expect(mockOpen).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'wizard-hat' }),
        'focus',
        slotElement,
        'left',
      );
    });
  });

  describe('fallback behavior when slotElement is not provided', () => {
    const testItem = items[0]!;

    it('InventoryItem falls back to its own button element when slotElement is omitted', async () => {
      const user = userEvent.setup();
      render(<InventoryItem item={testItem} slot="head" />);

      const button = screen.getByRole('button');
      await user.hover(button);

      expect(mockOpen).toHaveBeenCalledWith(testItem, 'hover', button, undefined);
    });

    it('FanOut falls back to individual fan-out item buttons when slotElement is omitted', async () => {
      const user = userEvent.setup();
      useInventoryStore.getState().setActiveFanoutSlot('head');
      const headItems = items.filter((i) => i.slotType === 'head');

      render(<FanOut slot="head" items={headItems} />);

      const firstFanoutButton = screen.getByTestId('fanout-item-iron-helm');
      await user.hover(firstFanoutButton);

      expect(mockOpen).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'iron-helm' }),
        'hover',
        firstFanoutButton,
        undefined,
      );
    });
  });
});
