import { useDroppable } from '@dnd-kit/core';
import type { ItemId } from '../../types/domain';
import { useInventoryStore } from '../../store/useInventoryStore';
import { useItem } from './useInventoryQuery';
import { InventoryItem } from './InventoryItem';

function BagCell({ index, itemId }: { readonly index: number; readonly itemId: ItemId | null }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${String(index)}`,
    data: { kind: 'cell', index },
  });
  const item = useItem(itemId);

  return (
    <div
      ref={setNodeRef}
      data-testid={`cell-${String(index)}`}
      className={`h-cell w-cell border bg-surface p-0.5 transition-colors ${
        isOver ? 'border-slot-valid bg-slot-valid/5' : 'border-slot-idle/50'
      }`}
    >
      {item !== undefined ? (
        <InventoryItem
          item={item}
          origin={{ kind: 'bag', index }}
          data-tooltip-surface="inventory"
        />
      ) : null}
    </div>
  );
}

/** The 24-cell droppable inventory grid, rendering bag IDs from the store. */
export function InventoryGrid() {
  const bag = useInventoryStore((s) => s.bag);

  return (
    <section aria-label="Inventory bag" data-testid="inventory-grid">
      <h2 className="mb-2.5 font-display text-[10px] font-bold uppercase tracking-[0.22em] text-gold/80">
        Bag
      </h2>
      <div className="grid w-fit max-w-full grid-cols-4 gap-1.5 sm:grid-cols-bag">
        {bag.map((itemId, index) => (
          <BagCell key={index} index={index} itemId={itemId} />
        ))}
      </div>
    </section>
  );
}
