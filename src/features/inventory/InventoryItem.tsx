import { useRef, useEffect } from 'react';
import type { Item, SlotType } from '../../types/domain';
import { useItemTooltip } from './tooltip';
import type { ButtonHTMLAttributes } from 'react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useSound } from '../audio/useSound';
import { handleEquipmentKeyDown } from './keyboard';

interface InventoryItemProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'item'
> {
  readonly item: Item;
  readonly slot: SlotType;
}

const FALLBACK_ICON = '◻️';

function resolveIcon(icon: string): string {
  return icon.trim().length > 0 ? icon : FALLBACK_ICON;
}

/**
 * Focusable item tile rendered inside an equipment slot.
 * Clicking unequips the item from its slot.
 */
export function InventoryItem({ item, slot, ...buttonProps }: InventoryItemProps) {
  const tooltip = useItemTooltip();
  const describedBy = tooltip.ariaDescribedByFor(item.id);
  const elementRef = useRef<HTMLButtonElement | null>(null);

  const focusedSection = useInventoryStore((s) => s.focusedSection);
  const focusedSlot = useInventoryStore((s) => s.focusedSlot);
  const play = useSound();

  const isActive = focusedSection === 'equipment' && focusedSlot === slot;

  useEffect(() => {
    if (isActive) {
      if (elementRef.current && document.activeElement !== elementRef.current) {
        elementRef.current.focus();
      }
    }
  }, [isActive]);

  const tabIndex = focusedSection === 'equipment' && focusedSlot === slot ? 0 : -1;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    buttonProps.onClick?.(e);
    const store = useInventoryStore.getState();
    store.unequip(slot);
    play('unequip');
  };

  return (
    <button
      {...buttonProps}
      ref={elementRef}
      type="button"
      tabIndex={tabIndex}
      data-testid={`item-${item.id}`}
      aria-label={`${item.name} (${item.slotType})`}
      className="flex h-full w-full items-center justify-center bg-surface-raised/80 p-1 text-ink transition-colors outline-offset-2 hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-slot-valid"
      onMouseEnter={() => {
        tooltip.open(item, 'hover', elementRef.current);
      }}
      onMouseLeave={() => {
        tooltip.closeFor(item.id, 'hover');
      }}
      onFocus={(e) => {
        useInventoryStore.getState().setFocusedSection('equipment');
        useInventoryStore.getState().setFocusedSlot(slot);
        tooltip.open(item, 'focus', elementRef.current);
        buttonProps.onFocus?.(e);
      }}
      onBlur={(e) => {
        tooltip.closeFor(item.id, 'focus');
        buttonProps.onBlur?.(e);
      }}
      onKeyDownCapture={(event) => {
        if (event.key === 'Escape') {
          tooltip.dismiss();
        }
      }}
      onKeyDown={(event) => {
        handleEquipmentKeyDown(event, slot);
        buttonProps.onKeyDown?.(event);
      }}
      onClick={handleClick}
      aria-describedby={describedBy ?? undefined}
    >
      <span aria-hidden="true" className="text-2xl leading-none">
        {resolveIcon(item.icon)}
      </span>
    </button>
  );
}
