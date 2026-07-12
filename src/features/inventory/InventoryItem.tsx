import { useDraggable } from '@dnd-kit/core';
import { useCallback, useRef } from 'react';
import type { DragOrigin, Item } from '../../types/domain';
import { useItemTooltip } from './tooltip';
import type { ButtonHTMLAttributes } from 'react';

interface InventoryItemProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'item'> {
  readonly item: Item;
  readonly origin: DragOrigin;
}

const FALLBACK_ICON = '◻️';

function resolveIcon(icon: string): string {
  return icon.trim().length > 0 ? icon : FALLBACK_ICON;
}

/**
 * Draggable item tile. Rendered inside a bag cell or an equipment slot;
 * the drag `data` payload carries everything drop resolution needs.
 */
export function InventoryItem({ item, origin, ...buttonProps }: InventoryItemProps) {
  const tooltip = useItemTooltip();
  const elementRef = useRef<HTMLButtonElement | null>(null);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
    data: { itemId: item.id, slotType: item.slotType, origin },
  });
  const setRefs = useCallback(
    (node: HTMLButtonElement | null) => {
      elementRef.current = node;
      setNodeRef(node);
    },
    [setNodeRef],
  );
  const describedBy = tooltip.ariaDescribedByFor(item.id);
  const mergedDescribedBy = [attributes['aria-describedby'], describedBy]
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .join(' ');

  return (
    <button
      ref={setRefs}
      type="button"
      data-testid={`item-${item.id}`}
      aria-label={`${item.name} (${item.slotType})`}
      className={`flex h-full w-full items-center justify-center bg-surface-raised/80 p-1 text-ink transition-colors outline-offset-2 hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-slot-valid ${
        isDragging ? 'opacity-25' : ''
      }`}
      onMouseEnter={() => {
        tooltip.open(item, 'hover', elementRef.current);
      }}
      onMouseLeave={() => {
        tooltip.closeFor(item.id, 'hover');
      }}
      onFocus={() => {
        tooltip.open(item, 'focus', elementRef.current);
      }}
      onBlur={() => {
        tooltip.closeFor(item.id, 'focus');
      }}
      onKeyDownCapture={(event) => {
        if (event.key === 'Escape') {
          tooltip.dismiss();
        }
      }}
      {...buttonProps}
      {...attributes}
      {...listeners}
      aria-describedby={mergedDescribedBy.length > 0 ? mergedDescribedBy : undefined}
    >
      <span aria-hidden="true" className="text-2xl leading-none">
        {resolveIcon(item.icon)}
      </span>
    </button>
  );
}

/** Presentation-only tile for the DragOverlay (not draggable itself). */
export function ItemTilePreview({ item }: { readonly item: Item }) {
  return (
    <div className="flex h-cell w-cell items-center justify-center bg-surface-raised/90 p-1 shadow-[0_0_16px_rgba(86,173,116,0.5)] ring-1 ring-slot-valid">
      <span aria-hidden="true" className="text-2xl leading-none">
        {resolveIcon(item.icon)}
      </span>
    </div>
  );
}
