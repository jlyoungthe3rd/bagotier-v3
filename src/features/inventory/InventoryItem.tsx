import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import type { Item, SlotType } from '../../types/domain';
import { useItemTooltip } from './tooltip';
import type { ButtonHTMLAttributes } from 'react';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useSound } from '../audio/useSound';
import { handleEquipmentKeyDown } from './keyboard';
import { SLOT_LABELS } from '../character/FanOut';

interface InventoryItemProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'item'
> {
  readonly item: Item;
  readonly slot: SlotType;
  readonly hasFanout?: boolean;
  readonly isFanoutOpen?: boolean;
  readonly onDismissFanout?: () => void;
}

const FALLBACK_ICON = '◻️';

function resolveIcon(icon: string): string {
  return icon.trim().length > 0 ? icon : FALLBACK_ICON;
}

/**
 * Focusable item tile rendered inside an equipment slot.
 * Clicking unequips the item from its slot.
 */
export const InventoryItem = forwardRef<HTMLButtonElement, InventoryItemProps>(
  function InventoryItem(
    { item, slot, hasFanout, isFanoutOpen, onDismissFanout, ...buttonProps },
    forwardedRef,
  ) {
    const tooltip = useItemTooltip();
    const describedBy = tooltip.ariaDescribedByFor(item.id);
    const elementRef = useRef<HTMLButtonElement | null>(null);

    useImperativeHandle(forwardedRef, () => {
      if (elementRef.current === null) {
        throw new Error('InventoryItem button ref is not mounted');
      }
      return elementRef.current;
    });

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

    const isDefaultSlot = focusedSection === null && slot === 'head';
    const tabIndex =
      (focusedSection === 'equipment' && focusedSlot === slot) || isDefaultSlot ? 0 : -1;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      buttonProps.onClick?.(e);
      const store = useInventoryStore.getState();
      store.unequip(slot);
      store.setFeedback(`Unequipped ${item.name} from ${SLOT_LABELS[slot]} slot.`);
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
        aria-haspopup={hasFanout ? 'listbox' : undefined}
        aria-expanded={hasFanout ? isFanoutOpen : undefined}
        aria-controls={hasFanout && isFanoutOpen ? `fanout-listbox-${slot}` : undefined}
        aria-description={
          hasFanout
            ? 'Equipped item. Press Enter or Space to unequip. Alternate items available in fan-out.'
            : 'Equipped item. Press Enter or Space to unequip.'
        }
        className="flex h-full w-full items-center justify-center bg-surface-raised/80 p-1 text-ink transition-colors outline-offset-2 hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-slot-valid motion-reduce:transition-none"
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
            if (isFanoutOpen) {
              event.stopPropagation();
              useInventoryStore
                .getState()
                .setFeedback(`Closed ${SLOT_LABELS[slot]} slot options.`);
              onDismissFanout?.();
            }
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
  },
);
