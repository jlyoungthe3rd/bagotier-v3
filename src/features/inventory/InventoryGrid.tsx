import type { ItemId } from '../../types/domain';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useItem } from './useInventoryQuery';
import { InventoryItem } from './InventoryItem';
import { useEffect, useRef } from 'react';
import { useItemTooltip } from './tooltip';
import { handleBagKeyDown } from './keyboard';

function BagCell({
  index,
  itemId,
}: {
  readonly index: number;
  readonly itemId: ItemId | null;
}) {
  const item = useItem(itemId);
  const tooltip = useItemTooltip();
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const focusedSection = useInventoryStore((s) => s.focusedSection);
  const focusedBagIndex = useInventoryStore((s) => s.focusedBagIndex);

  const isActive = focusedSection === 'bag' && focusedBagIndex === index;

  useEffect(() => {
    if (isActive && item === undefined) {
      if (buttonRef.current && document.activeElement !== buttonRef.current) {
        buttonRef.current.focus();
      }
    }
  }, [isActive, item]);

  const tabIndex =
    (focusedSection === 'bag' || focusedSection === null) && focusedBagIndex === index
      ? 0
      : -1;

  return (
    <div
      data-testid={`cell-${String(index)}`}
      className="aspect-square border border-slot-idle/50 bg-surface p-0.5 transition-colors"
    >
      {item !== undefined ? (
        <InventoryItem
          item={item}
          origin={{ kind: 'bag', index }}
          data-tooltip-surface="inventory"
        />
      ) : (
        <button
          ref={buttonRef}
          type="button"
          tabIndex={tabIndex}
          data-testid={`cell-empty-button-${String(index)}`}
          aria-label={`Empty bag cell ${String(index + 1)}`}
          className="flex h-full w-full items-center justify-center bg-transparent transition-colors outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-slot-valid"
          onFocus={() => {
            useInventoryStore.getState().setFocusedSection('bag');
            useInventoryStore.getState().setFocusedBagIndex(index);
            tooltip.dismiss();
          }}
          onKeyDown={(event) => {
            handleBagKeyDown(event, index);
          }}
        />
      )}
    </div>
  );
}

/** The 24-cell inventory grid, rendering bag IDs from the store. */
export function InventoryGrid() {
  const bag = useInventoryStore((s) => s.bag);

  return (
    <section aria-label="Inventory bag" data-testid="inventory-grid">
      <h2 className="mb-2.5 font-display text-[10px] font-bold uppercase tracking-[0.22em] text-gold/80">
        Bag
      </h2>
      <div className="grid w-full grid-cols-4 gap-1.5 sm:grid-cols-6 lg:grid-cols-8">
        {bag.map((itemId, index) => (
          <BagCell key={index} index={index} itemId={itemId} />
        ))}
      </div>
    </section>
  );
}
