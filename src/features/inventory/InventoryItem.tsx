import { useRef, useEffect } from 'react';
import type { DragOrigin, Item } from '../../types/domain';
import { useItemTooltip } from './tooltip';
import type { ButtonHTMLAttributes } from 'react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useSound } from '../audio/useSound';
import { handleBagKeyDown, handleEquipmentKeyDown } from './keyboard';

interface InventoryItemProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'item'
> {
  readonly item: Item;
  readonly origin: DragOrigin;
}

const FALLBACK_ICON = '◻️';

function resolveIcon(icon: string): string {
  return icon.trim().length > 0 ? icon : FALLBACK_ICON;
}

/**
 * Focusable item tile. Rendered inside a bag cell or an equipment slot;
 * clicking or pressing Enter/Space instantly equips or unequips the item.
 */
export function InventoryItem({ item, origin, ...buttonProps }: InventoryItemProps) {
  const tooltip = useItemTooltip();
  const describedBy = tooltip.ariaDescribedByFor(item.id);
  const elementRef = useRef<HTMLButtonElement | null>(null);

  const focusedSection = useInventoryStore((s) => s.focusedSection);
  const focusedBagIndex = useInventoryStore((s) => s.focusedBagIndex);
  const focusedSlot = useInventoryStore((s) => s.focusedSlot);
  const play = useSound();

  const isActive =
    origin.kind === 'bag'
      ? focusedSection === 'bag' && focusedBagIndex === origin.index
      : focusedSection === 'equipment' && focusedSlot === origin.slot;

  useEffect(() => {
    if (isActive) {
      if (elementRef.current && document.activeElement !== elementRef.current) {
        elementRef.current.focus();
      }
    }
  }, [isActive]);

  const tabIndex =
    origin.kind === 'bag'
      ? (focusedSection === 'bag' || focusedSection === null) &&
        focusedBagIndex === origin.index
        ? 0
        : -1
      : focusedSection === 'equipment' && focusedSlot === origin.slot
        ? 0
        : -1;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    buttonProps.onClick?.(e);
    const store = useInventoryStore.getState();
    if (origin.kind === 'bag') {
      const currentOccupant = store.equipped[item.slotType];
      if (currentOccupant === null) {
        store.equip(item.id, item.slotType);
        play('equip');
      } else {
        store.swap(item.id, item.slotType);
        play('equip');
      }
    } else {
      const result = store.unequip(origin.slot);
      if (result === 'bag-full') {
        play('invalid');
      } else {
        play('unequip');
      }
    }
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
        if (origin.kind === 'bag') {
          useInventoryStore.getState().setFocusedSection('bag');
          useInventoryStore.getState().setFocusedBagIndex(origin.index);
        } else {
          useInventoryStore.getState().setFocusedSection('equipment');
          useInventoryStore.getState().setFocusedSlot(origin.slot);
        }
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
        if (origin.kind === 'bag') {
          handleBagKeyDown(event, origin.index);
        } else {
          handleEquipmentKeyDown(event, origin.slot);
        }
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
