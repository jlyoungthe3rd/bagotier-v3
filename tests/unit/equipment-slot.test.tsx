import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EquipmentSlot } from '../../src/features/character/EquipmentSlot';
import { ItemTooltipProvider } from '../../src/features/inventory/tooltip';
import { audioEngine } from '../../src/features/audio/useSound';
import { registerItemSlotTypes, useInventoryStore } from '../../src/store/useInventoryStore';
import { items } from '../../src/mocks/items';
import { resetSlotHoverManager } from '../../src/features/character/slotHoverManager';
import type { ItemId, SlotType } from '../../src/types/domain';

function renderEquipmentSlot(slot: SlotType = 'head', itemId: ItemId | null = null) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(['items'], items);

  return render(
    <QueryClientProvider client={queryClient}>
      <ItemTooltipProvider>
        <EquipmentSlot slot={slot} itemId={itemId} />
      </ItemTooltipProvider>
    </QueryClientProvider>,
  );
}

describe('EquipmentSlot component', () => {
  beforeEach(() => {
    resetSlotHoverManager();
    useInventoryStore.getState().reset();
    registerItemSlotTypes(Object.fromEntries(items.map((i) => [i.id, i.slotType])));
    useInventoryStore.getState().seedUnequipped(items.map((i) => i.id));
  });

  describe('empty slot rendering', () => {
    it('renders empty slot button with silhouette icon and label', () => {
      renderEquipmentSlot('head', null);

      expect(screen.getByTestId('slot-head')).toBeInTheDocument();
      expect(screen.getByTestId('slot-empty-button-head')).toBeInTheDocument();
      expect(screen.getByTestId('slot-empty-head')).toHaveTextContent('🪖');
      expect(screen.getByText('Head')).toBeInTheDocument();
    });
  });

  describe('keyboard focus triggering instant fanout', () => {
    it('opens fanout immediately when empty slot button receives keyboard focus', () => {
      renderEquipmentSlot('head', null);

      const emptyBtn = screen.getByTestId('slot-empty-button-head');
      act(() => {
        emptyBtn.focus();
      });

      expect(useInventoryStore.getState().focusedSection).toBe('equipment');
      expect(useInventoryStore.getState().focusedSlot).toBe('head');
      expect(useInventoryStore.getState().activeFanoutSlot).toBe('head');
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  describe('hover delay triggering fanout', () => {
    it('opens fanout after 300ms base hover delay on mouse enter', () => {
      vi.useFakeTimers();
      renderEquipmentSlot('head', null);

      const slotElement = screen.getByTestId('slot-head');

      // Mouse enter starts timer
      fireEvent.mouseEnter(slotElement);
      expect(useInventoryStore.getState().activeFanoutSlot).toBeNull();

      // Before 300ms, fanout is not open
      act(() => {
        vi.advanceTimersByTime(250);
      });
      expect(useInventoryStore.getState().activeFanoutSlot).toBeNull();

      // At 300ms, fanout opens
      act(() => {
        vi.advanceTimersByTime(50);
      });
      expect(useInventoryStore.getState().activeFanoutSlot).toBe('head');

      vi.useRealTimers();
    });

    it('cancels pending hover timer if mouse leaves before delay expires', () => {
      vi.useFakeTimers();
      renderEquipmentSlot('head', null);

      const slotElement = screen.getByTestId('slot-head');

      fireEvent.mouseEnter(slotElement);
      act(() => {
        vi.advanceTimersByTime(150);
      });

      // Mouse leave cancels the timer
      fireEvent.mouseLeave(slotElement);

      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(useInventoryStore.getState().activeFanoutSlot).toBeNull();

      vi.useRealTimers();
    });

    it('closes fanout after grace period when mouse leaves container', () => {
      vi.useFakeTimers();
      renderEquipmentSlot('head', null);

      const slotElement = screen.getByTestId('slot-head');
      fireEvent.mouseEnter(slotElement);

      // Open fanout
      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(useInventoryStore.getState().activeFanoutSlot).toBe('head');

      // Mouse leaves outer container
      const container = slotElement.parentElement!;
      fireEvent.mouseLeave(container);

      // Grace period (200ms) before close
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(useInventoryStore.getState().activeFanoutSlot).toBe('head');

      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(useInventoryStore.getState().activeFanoutSlot).toBeNull();

      vi.useRealTimers();
    });
  });

  describe('clicking equipped item unequipping', () => {
    it('unequips the equipped item and plays unequip sound when clicked', async () => {
      const user = userEvent.setup();
      const playbackSpy = vi.spyOn(audioEngine, 'playback');

      // Equip iron-helm in store
      useInventoryStore.getState().equip('iron-helm' as never, 'head');

      renderEquipmentSlot('head', 'iron-helm' as never);

      const equippedItem = screen.getByTestId('item-iron-helm');
      expect(equippedItem).toBeInTheDocument();

      await user.click(equippedItem);

      expect(useInventoryStore.getState().equipped.head).toBeNull();
      expect(playbackSpy).toHaveBeenCalledWith('unequip');

      playbackSpy.mockRestore();
    });
  });
});
